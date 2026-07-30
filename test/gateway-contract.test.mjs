import assert from "node:assert/strict";
import test from "node:test";
import {
  buildObservedLock,
  validateGatewayCompatibility,
  validatePluginConfiguration,
} from "../scripts/check-gateway-contract.mjs";

const contract = {
  gateway: {
    id: "oda-intelligence",
    url: "https://example.com/mcp",
    server_name: "oda-intelligence",
  },
  tools: {
    search: {
      allowed_required_inputs: ["query"],
      input_properties: {
        query: "string",
        category: "null|string",
      },
      output_required: ["result"],
      read_only: true,
    },
  },
};

function observedSearch() {
  return {
    serverInfo: { name: "oda-intelligence", version: "1.0.0" },
    instructions: "Use the approved public tools.",
    tools: [
      {
        name: "search",
        description: "Search",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            category: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            limit: { type: "integer" },
          },
          required: ["query"],
        },
        outputSchema: {
          type: "object",
          properties: { result: { type: "object" } },
          required: ["result"],
        },
        annotations: { readOnlyHint: true },
      },
    ],
  };
}

test("compatible optional inputs and nullable types pass", () => {
  assert.deepEqual(
    validateGatewayCompatibility(contract, observedSearch()),
    [],
  );
});

test("new required inputs, missing outputs, and write capability fail", () => {
  const observed = observedSearch();
  observed.tools[0].inputSchema.required.push("limit");
  observed.tools[0].outputSchema.required = [];
  observed.tools[0].annotations.readOnlyHint = false;
  const failures = validateGatewayCompatibility(contract, observed).join("\n");
  assert.match(failures, /new required input limit/);
  assert.match(failures, /required output result is missing/);
  assert.match(failures, /readOnlyHint is no longer true/);
});

test("reviewed coordinate tools require true input and bounded coordinate output", () => {
  const coordinateContract = structuredClone(contract);
  coordinateContract.tools.search.input_properties.include_coordinates =
    "boolean";
  coordinateContract.tools.search.input_true_allowed = [
    "include_coordinates",
  ];
  coordinateContract.tools.search.requires_coordinate_output = true;

  const observed = observedSearch();
  observed.tools[0].inputSchema.properties.include_coordinates = {
    type: "boolean",
  };
  observed.tools[0].outputSchema.properties.result = {
    type: "object",
    properties: {
      locations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            coordinates: {
              type: "object",
              properties: {
                lat: { type: "number", minimum: -90, maximum: 90 },
                lon: { type: "number", minimum: -180, maximum: 180 },
              },
            },
          },
        },
      },
    },
  };
  assert.deepEqual(
    validateGatewayCompatibility(coordinateContract, observed),
    [],
  );

  observed.tools[0].inputSchema.properties.include_coordinates.const = false;
  observed.tools[0].outputSchema.properties.result = { type: "object" };
  const failures = validateGatewayCompatibility(
    coordinateContract,
    observed,
  ).join("\n");
  assert.match(failures, /include_coordinates no longer allows true/);
  assert.match(failures, /coordinates output schema is missing or invalid/);
});

test("observed lock excludes repositories and source implementation details", () => {
  const lock = buildObservedLock(contract, observedSearch());
  assert.equal(lock.gateway.server_name, "oda-intelligence");
  assert.equal(lock.gateway.tool_count, 1);
  assert.ok(lock.gateway.tools.search);
  assert.match(lock.gateway.instructions_sha256, /^[a-f0-9]{64}$/);
  assert.ok(!Object.hasOwn(lock.gateway, "server_version"));
  assert.doesNotMatch(JSON.stringify(lock), /repository|commit|source_repo/i);
});

test("plugin configuration permits one credential-free gateway only", () => {
  const config = {
    mcpServers: {
      "oda-intelligence": {
        type: "http",
        url: "https://example.com/mcp",
      },
    },
  };
  assert.deepEqual(validatePluginConfiguration(contract, config), []);

  config.mcpServers.direct = {
    type: "http",
    url: "https://other.example/mcp",
  };
  assert.match(
    validatePluginConfiguration(contract, config).join("\n"),
    /exactly one MCP gateway/,
  );
});

test("credentials and unapproved gateway configuration fail", () => {
  const config = {
    mcpServers: {
      "oda-intelligence": {
        type: "http",
        url: "https://example.com/mcp",
        http_headers: { "X-API-Key": "not-a-real-key" },
      },
    },
  };
  assert.match(
    validatePluginConfiguration(contract, config).join("\n"),
    /only type and url/,
  );
});

test("forbidden, additional, and write-capable public tools fail", () => {
  const guardedContract = structuredClone(contract);
  guardedContract.compatibility_policy = {
    allow_additional_tools: false,
    require_read_only: true,
    forbidden_tools: ["raw_document"],
  };
  const observed = observedSearch();
  observed.tools.push(
    {
      name: "raw_document",
      inputSchema: { type: "object" },
      annotations: { readOnlyHint: true },
    },
    {
      name: "write_record",
      inputSchema: { type: "object" },
      annotations: { readOnlyHint: false },
    },
  );
  const failures = validateGatewayCompatibility(
    guardedContract,
    observed,
  ).join("\n");
  assert.match(failures, /forbidden public tool raw_document/);
  assert.match(failures, /unapproved additional tool raw_document/);
  assert.match(failures, /unapproved additional tool write_record/);
  assert.match(failures, /write_record: readOnlyHint is not true/);
});
