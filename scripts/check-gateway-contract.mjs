#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_PATH = resolve(ROOT, "package.json");
const CONTRACT_PATH = resolve(ROOT, "contracts", "gateway-contract.json");
const LOCK_PATH = resolve(ROOT, "contracts", "observed.lock.json");
const MCP_CONFIG_PATH = resolve(
  ROOT,
  "plugins",
  "oda-intelligence",
  ".mcp.json",
);

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableJson(value) {
  return JSON.stringify(stableValue(value), null, 2);
}

function schemaTypes(schema) {
  if (!schema || typeof schema !== "object") return new Set();
  const types = new Set();
  if (typeof schema.type === "string") types.add(schema.type);
  if (Array.isArray(schema.type)) {
    for (const type of schema.type) types.add(type);
  }
  for (const variant of [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])]) {
    for (const type of schemaTypes(variant)) types.add(type);
  }
  return types;
}

function matchesExpectedTypes(schema, expected) {
  const actual = schemaTypes(schema);
  return expected.split("|").every((type) => actual.has(type));
}

function schemaAllowsBooleanTrue(schema) {
  if (!schema || typeof schema !== "object") return false;
  if (Object.hasOwn(schema, "const")) return schema.const === true;
  if (Array.isArray(schema.enum)) return schema.enum.includes(true);
  if (schema.type === "boolean") return true;
  return [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].some(
    schemaAllowsBooleanTrue,
  );
}

function hasPublicCoordinateSchema(schema) {
  if (!schema || typeof schema !== "object") return false;
  const coordinates = schema.properties?.coordinates;
  const latitude = coordinates?.properties?.lat;
  const longitude = coordinates?.properties?.lon;
  if (
    coordinates?.type === "object" &&
    latitude?.type === "number" &&
    latitude.minimum === -90 &&
    latitude.maximum === 90 &&
    longitude?.type === "number" &&
    longitude.minimum === -180 &&
    longitude.maximum === 180
  ) {
    return true;
  }
  return Object.values(schema).some((value) => {
    if (Array.isArray(value)) return value.some(hasPublicCoordinateSchema);
    return hasPublicCoordinateSchema(value);
  });
}

export function validateGatewayCompatibility(contract, observed) {
  const failures = [];
  if (observed.serverInfo?.name !== contract.gateway.server_name) {
    failures.push(
      `gateway: server name is ${observed.serverInfo?.name ?? "missing"}, expected ${contract.gateway.server_name}`,
    );
  }

  const observedTools = new Map();
  for (const tool of observed.tools ?? []) {
    if (observedTools.has(tool.name)) {
      failures.push(`gateway: duplicate tool ${tool.name}`);
    }
    observedTools.set(tool.name, tool);
    if (
      contract.compatibility_policy?.require_read_only &&
      tool.annotations?.readOnlyHint !== true
    ) {
      failures.push(`${tool.name}: readOnlyHint is not true`);
    }
  }

  for (const forbiddenTool of
    contract.compatibility_policy?.forbidden_tools ?? []) {
    if (observedTools.has(forbiddenTool)) {
      failures.push(`gateway: forbidden public tool ${forbiddenTool} is exposed`);
    }
  }

  if (!contract.compatibility_policy?.allow_additional_tools) {
    for (const toolName of observedTools.keys()) {
      if (!Object.hasOwn(contract.tools, toolName)) {
        failures.push(`gateway: unapproved additional tool ${toolName} is exposed`);
      }
    }
  }

  for (const [toolName, expectedTool] of Object.entries(contract.tools)) {
    const actual = observedTools.get(toolName);
    if (!actual) {
      failures.push(`gateway: required tool ${toolName} is missing`);
      continue;
    }

    const allowedRequired = new Set(
      expectedTool.allowed_required_inputs ?? [],
    );
    for (const input of actual.inputSchema?.required ?? []) {
      if (!allowedRequired.has(input)) {
        failures.push(`${toolName}: new required input ${input}`);
      }
    }

    for (const [property, expectedTypes] of Object.entries(
      expectedTool.input_properties ?? {},
    )) {
      const schema = actual.inputSchema?.properties?.[property];
      if (!schema) {
        failures.push(`${toolName}: input property ${property} is missing`);
      } else if (!matchesExpectedTypes(schema, expectedTypes)) {
        failures.push(
          `${toolName}: input property ${property} is incompatible with ${expectedTypes}`,
        );
      }
    }

    for (const property of expectedTool.input_true_allowed ?? []) {
      const schema = actual.inputSchema?.properties?.[property];
      if (!schemaAllowsBooleanTrue(schema)) {
        failures.push(`${toolName}: input property ${property} no longer allows true`);
      }
    }

    if (
      expectedTool.requires_coordinate_output &&
      !hasPublicCoordinateSchema(actual.outputSchema)
    ) {
      failures.push(
        `${toolName}: public coordinates output schema is missing or invalid`,
      );
    }

    if (
      expectedTool.read_only &&
      actual.annotations?.readOnlyHint !== true
    ) {
      failures.push(`${toolName}: readOnlyHint is no longer true`);
    }

    for (const property of expectedTool.output_required ?? []) {
      if (!(actual.outputSchema?.required ?? []).includes(property)) {
        failures.push(`${toolName}: required output ${property} is missing`);
      }
    }
  }

  return failures;
}

function toolContractHash(tool) {
  const value = {
    name: tool.name,
    title: tool.title ?? null,
    description: tool.description ?? null,
    inputSchema: tool.inputSchema ?? null,
    outputSchema: tool.outputSchema ?? null,
    annotations: tool.annotations ?? null,
    securitySchemes: tool.securitySchemes ?? null,
    execution: tool.execution ?? null,
    icons: tool.icons ?? null,
    _meta: tool._meta ?? null,
  };
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function valueHash(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function buildObservedLock(contract, observed) {
  return {
    schema_version: 1,
    gateway: {
      url: contract.gateway.url,
      server_name: observed.serverInfo.name,
      instructions_sha256: valueHash(observed.instructions ?? null),
      tool_count: observed.tools.length,
      tools: Object.fromEntries(
        [...observed.tools]
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((tool) => [tool.name, toolContractHash(tool)]),
      ),
    },
  };
}

export function validatePluginConfiguration(contract, config) {
  const gateway = config.mcpServers?.[contract.gateway.id];
  const failures = [];
  if (!gateway) {
    failures.push(`MCP config is missing ${contract.gateway.id}`);
    return failures;
  }
  if (Object.keys(config.mcpServers).length !== 1) {
    failures.push("Plugin must configure exactly one MCP gateway");
  }
  if (gateway.type !== "http" || gateway.url !== contract.gateway.url) {
    failures.push("Plugin gateway transport or URL does not match the contract");
  }
  const gatewayKeys = Object.keys(gateway).sort();
  if (
    gatewayKeys.length !== 2 ||
    gatewayKeys[0] !== "type" ||
    gatewayKeys[1] !== "url"
  ) {
    failures.push(
      "Public plugin gateway configuration may contain only type and url",
    );
  }
  return failures;
}

export async function inspectGateway(contract) {
  const packageMetadata = await readJson(PACKAGE_PATH);
  const transport = new StreamableHTTPClientTransport(
    new URL(contract.gateway.url),
  );
  const client = new Client({
    name: "oda-intelligence-plugin-contract-check",
    version: packageMetadata.version,
  });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    return {
      serverInfo: client.getServerVersion() ?? {},
      instructions: client.getInstructions() ?? null,
      tools: listed.tools ?? [],
    };
  } finally {
    await Promise.allSettled([client.close(), transport.close()]);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  const updateLock = process.argv.includes("--update-lock");
  const contract = await readJson(CONTRACT_PATH);
  const config = await readJson(MCP_CONFIG_PATH);
  const staticFailures = validatePluginConfiguration(contract, config);
  if (staticFailures.length) throw new Error(staticFailures.join("\n"));

  const observed = await inspectGateway(contract);
  const compatibilityFailures = validateGatewayCompatibility(
    contract,
    observed,
  );
  if (compatibilityFailures.length) {
    throw new Error(
      `Breaking gateway contract:\n${compatibilityFailures.join("\n")}`,
    );
  }

  const nextLock = `${stableJson(buildObservedLock(contract, observed))}\n`;
  const previousLock = await readFile(LOCK_PATH, "utf8").catch(() => "");
  const changed = previousLock !== nextLock;
  if (updateLock && changed) await writeFile(LOCK_PATH, nextLock, "utf8");

  console.log(
    changed
      ? updateLock
        ? "Compatible gateway drift written to observed.lock.json."
        : "Compatible gateway drift detected."
      : "Live gateway contract matches observed.lock.json.",
  );
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, {
      flag: "a",
    });
  }
  if (changed && !updateLock) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
