#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
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

// The v1 observation lock stores one hash for each complete tool contract. A
// changed tool hash can therefore include a schema or detailed constraint
// change that the compatibility floor above does not prove safe. Keep those
// changes for human review. Only lock-only metadata drift (currently the
// gateway instructions hash) may be released automatically.
export function canAutoMergeObservedLock(previous, next) {
  if (!previous || !next) return false;
  return isDeepStrictEqual(
    {
      schema_version: previous.schema_version,
      gateway: {
        url: previous.gateway?.url,
        server_name: previous.gateway?.server_name,
        tool_count: previous.gateway?.tool_count,
        tools: previous.gateway?.tools,
      },
    },
    {
      schema_version: next.schema_version,
      gateway: {
        url: next.gateway?.url,
        server_name: next.gateway?.server_name,
        tool_count: next.gateway?.tool_count,
        tools: next.gateway?.tools,
      },
    },
  );
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

// A tool can satisfy every schema check in tools/list and still fail on every
// call — the gateway sanitizes responses after the upstream answers, so an
// upstream field the response policy does not allow blocks the tool while its
// advertised contract stays intact. Only a real call sees that.
export function validateSmokeCoverage(contract) {
  const failures = [];
  for (const [toolName, spec] of Object.entries(contract.tools ?? {})) {
    const hasArguments =
      spec.smoke_arguments !== null &&
      typeof spec.smoke_arguments === "object" &&
      !Array.isArray(spec.smoke_arguments);
    const hasExemption =
      typeof spec.smoke_exempt_reason === "string" &&
      spec.smoke_exempt_reason.length > 0;
    if (hasArguments && hasExemption) {
      failures.push(
        `${toolName}: smoke_arguments and smoke_exempt_reason are both set`,
      );
    } else if (!hasArguments && !hasExemption) {
      failures.push(
        `${toolName}: needs smoke_arguments or a smoke_exempt_reason`,
      );
    }
    if (spec.smoke_output_assertions !== undefined) {
      if (!hasArguments) {
        failures.push(
          `${toolName}: smoke_output_assertions require smoke_arguments`,
        );
      }
      if (
        !Array.isArray(spec.smoke_output_assertions) ||
        spec.smoke_output_assertions.length === 0
      ) {
        failures.push(
          `${toolName}: smoke_output_assertions must be a non-empty array`,
        );
        continue;
      }
      for (const [index, assertion] of spec.smoke_output_assertions.entries()) {
        const pathIsValid =
          Array.isArray(assertion?.path) &&
          assertion.path.length > 0 &&
          assertion.path.every(
            (part) =>
              (typeof part === "string" && part.length > 0) ||
              (Number.isInteger(part) && part >= 0),
          );
        const modes = ["equals", "array_contains"].filter((mode) =>
          Object.hasOwn(assertion ?? {}, mode),
        );
        if (!pathIsValid || modes.length !== 1) {
          failures.push(
            `${toolName}: smoke_output_assertions[${index}] needs a path and exactly one assertion mode`,
          );
        }
      }
    }
  }
  return failures;
}

function describeToolError(result) {
  const text = result?.content?.find((part) => part?.type === "text")?.text;
  if (typeof text !== "string") return "no error text";
  try {
    const parsed = JSON.parse(text);
    return parsed.code ?? parsed.message ?? text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

function smokePayload(result) {
  if (
    result?.structuredContent &&
    typeof result.structuredContent === "object"
  ) {
    return result.structuredContent;
  }
  const text = result?.content?.find((part) => part?.type === "text")?.text;
  if (typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function valueAtPath(value, path) {
  return path.reduce(
    (current, part) =>
      current !== null && current !== undefined ? current[part] : undefined,
    value,
  );
}

function containsExpectedShape(actual, expected) {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    return (
      actual !== null &&
      typeof actual === "object" &&
      !Array.isArray(actual) &&
      Object.entries(expected).every(([key, value]) =>
        containsExpectedShape(actual[key], value),
      )
    );
  }
  return Object.is(actual, expected);
}

export function evaluateSmokeResults(results) {
  const failures = [];
  for (const { tool, result, error, assertions = [] } of results) {
    if (error) {
      failures.push(`${tool}: call failed — ${error}`);
    } else if (result?.isError === true) {
      failures.push(`${tool}: returned isError — ${describeToolError(result)}`);
    } else if (assertions.length > 0) {
      const payload = smokePayload(result);
      if (!payload) {
        failures.push(`${tool}: smoke output is not structured JSON`);
        continue;
      }
      for (const [index, assertion] of assertions.entries()) {
        const actual = valueAtPath(payload, assertion.path);
        if (
          Object.hasOwn(assertion, "equals") &&
          !isDeepStrictEqual(actual, assertion.equals)
        ) {
          failures.push(
            `${tool}: smoke_output_assertions[${index}] expected ${JSON.stringify(assertion.equals)} at ${assertion.path.join(".")}`,
          );
        }
        if (
          Object.hasOwn(assertion, "array_contains") &&
          (!Array.isArray(actual) ||
            !actual.some((item) =>
              containsExpectedShape(item, assertion.array_contains),
            ))
        ) {
          failures.push(
            `${tool}: smoke_output_assertions[${index}] did not find ${JSON.stringify(assertion.array_contains)} at ${assertion.path.join(".")}`,
          );
        }
      }
    }
  }
  return failures;
}

const SMOKE_CALL_TIMEOUT_MS = 240_000;

async function smokeTools(client, contract) {
  const results = [];
  // Sequential: the public gateway rate-limits per minute, and a burst of
  // parallel calls would report a limit breach as a broken tool.
  for (const [toolName, spec] of Object.entries(contract.tools ?? {})) {
    if (spec.smoke_exempt_reason) continue;
    try {
      const result = await client.callTool(
        { name: toolName, arguments: spec.smoke_arguments },
        undefined,
        // The country tools fan out to external APIs and answer in minutes on a
        // cold cache. The default 60s would report that as a broken tool.
        { timeout: SMOKE_CALL_TIMEOUT_MS },
      );
      results.push({
        tool: toolName,
        result,
        assertions: spec.smoke_output_assertions ?? [],
      });
    } catch (error) {
      results.push({
        tool: toolName,
        error: error instanceof Error ? error.message : "unknown error",
        assertions: spec.smoke_output_assertions ?? [],
      });
    }
  }
  return results;
}

export async function inspectGateway(contract, { smoke = false } = {}) {
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
      smokeResults: smoke ? await smokeTools(client, contract) : [],
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
  const skipSmoke = process.argv.includes("--skip-smoke");
  const contract = await readJson(CONTRACT_PATH);
  const config = await readJson(MCP_CONFIG_PATH);
  const staticFailures = [
    ...validatePluginConfiguration(contract, config),
    ...validateSmokeCoverage(contract),
  ];
  if (staticFailures.length) throw new Error(staticFailures.join("\n"));

  const observed = await inspectGateway(contract, { smoke: !skipSmoke });
  const compatibilityFailures = validateGatewayCompatibility(
    contract,
    observed,
  );
  if (compatibilityFailures.length) {
    throw new Error(
      `Breaking gateway contract:\n${compatibilityFailures.join("\n")}`,
    );
  }

  const smokeFailures = evaluateSmokeResults(observed.smokeResults);
  if (smokeFailures.length) {
    throw new Error(
      `Gateway tools advertised but not callable:\n${smokeFailures.join("\n")}`,
    );
  }
  if (!skipSmoke) {
    const exempt = Object.entries(contract.tools).filter(
      ([, spec]) => spec.smoke_exempt_reason,
    );
    console.log(
      `Smoke-called ${observed.smokeResults.length} tools; ${exempt.length} exempt (${exempt.map(([name]) => name).join(", ")}).`,
    );
  }

  const nextLockValue = buildObservedLock(contract, observed);
  const nextLock = `${stableJson(nextLockValue)}\n`;
  const previousLock = await readFile(LOCK_PATH, "utf8").catch(() => "");
  const changed = previousLock !== nextLock;
  let previousLockValue = null;
  try {
    previousLockValue = JSON.parse(previousLock);
  } catch {
    // A missing or malformed baseline must be reviewed, never auto-merged.
  }
  const autoMerge =
    changed && canAutoMergeObservedLock(previousLockValue, nextLockValue);
  if (updateLock && changed) await writeFile(LOCK_PATH, nextLock, "utf8");

  console.log(
    changed
      ? updateLock
        ? "Compatible gateway drift written to observed.lock.json."
        : "Compatible gateway drift detected."
      : "Live gateway contract matches observed.lock.json.",
  );
  if (process.env.GITHUB_OUTPUT) {
    await writeFile(
      process.env.GITHUB_OUTPUT,
      `changed=${changed}\nauto_merge=${autoMerge}\n`,
      { flag: "a" },
    );
  }
  if (changed && !updateLock) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
