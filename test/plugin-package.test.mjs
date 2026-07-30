import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const pluginRoot = resolve(root, "plugins", "oda-intelligence");
const gatewayUrl = "https://oda-mcp.fly.dev/oda-intelligence/v1/mcp";
const expectedPublicFiles = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".github/workflows/ci.yml",
  ".github/workflows/update-gateway-contract.yml",
  ".gitignore",
  "LICENSE",
  "PRIVACY.md",
  "README.ko.md",
  "README.md",
  "SECURITY.md",
  "TERMS.md",
  "contracts/gateway-contract.json",
  "contracts/observed.lock.json",
  "package-lock.json",
  "package.json",
  "plugins/oda-intelligence/.claude-plugin/plugin.json",
  "plugins/oda-intelligence/.app.json",
  "plugins/oda-intelligence/.codex-plugin/plugin.json",
  "plugins/oda-intelligence/.mcp.json",
  "plugins/oda-intelligence/skills/generate-development-country-report/SKILL.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/agents/openai.yaml",
  "plugins/oda-intelligence/skills/generate-development-country-report/assets/country-report-template.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/citation-policy.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/report-standard.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/source-routing.md",
  "plugins/oda-intelligence/skills/koica-regulation-research/SKILL.md",
  "plugins/oda-intelligence/skills/koica-regulation-research/agents/openai.yaml",
  "plugins/oda-intelligence/skills/koica-regulation-research/references/research-protocol.md",
  "scripts/bump-plugin-version.mjs",
  "scripts/check-gateway-contract.mjs",
  "scripts/check-plugin-version.mjs",
  "test/gateway-contract.test.mjs",
  "test/plugin-package.test.mjs",
];

async function readJson(...parts) {
  return JSON.parse(await readFile(resolve(root, ...parts), "utf8"));
}

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(resolve(directory, entry.name), relative)));
    } else {
      files.push(relative);
    }
  }
  return files;
}

test("Claude and Codex manifests point only to the public plugin repository", async () => {
  const claude = await readJson(
    "plugins",
    "oda-intelligence",
    ".claude-plugin",
    "plugin.json",
  );
  const codex = await readJson(
    "plugins",
    "oda-intelligence",
    ".codex-plugin",
    "plugin.json",
  );
  const marketplace = await readJson(".claude-plugin", "marketplace.json");
  const codexMarketplace = await readJson(
    ".agents",
    "plugins",
    "marketplace.json",
  );
  const packageMetadata = await readJson("package.json");
  const packageLock = await readJson("package-lock.json");

  assert.equal(claude.repository, "https://github.com/amnotyoung/oda-intelligence-plugin");
  assert.equal(codex.repository, claude.repository);
  assert.equal(marketplace.name, "oda-intelligence-plugin");
  assert.equal(codexMarketplace.name, "oda-intelligence-plugin");
  assert.equal(
    codex.version.replace(/[+-].*$/, ""),
    claude.version.replace(/[+-].*$/, ""),
  );
  assert.equal(packageMetadata.version, codex.version);
  assert.equal(packageLock.version, codex.version);
  assert.equal(packageLock.packages[""].version, codex.version);
  assert.equal(marketplace.plugins[0].version, codex.version);
});

test("plugin and both Skills depend on one credential-free gateway", async () => {
  const claude = await readJson(
    "plugins",
    "oda-intelligence",
    ".claude-plugin",
    "plugin.json",
  );
  const codex = await readJson(
    "plugins",
    "oda-intelligence",
    ".codex-plugin",
    "plugin.json",
  );
  const mcp = await readJson(
    "plugins",
    "oda-intelligence",
    ".mcp.json",
  );

  // Claude discovers standard root-level skills/ and .mcp.json automatically.
  // Keep its manifest metadata-only to match Anthropic's web/Cowork examples.
  assert.equal(claude.skills, undefined);
  assert.equal(claude.mcpServers, undefined);
  assert.equal(codex.skills, "./skills/");
  assert.equal(codex.mcpServers, "./.mcp.json");
  assert.deepEqual(Object.keys(mcp.mcpServers), ["oda-intelligence"]);
  assert.equal(mcp.mcpServers["oda-intelligence"].url, gatewayUrl);
  assert.doesNotMatch(JSON.stringify(mcp), /authorization|token/i);

  for (const relative of [
    "skills/generate-development-country-report/agents/openai.yaml",
    "skills/koica-regulation-research/agents/openai.yaml",
  ]) {
    const text = await readFile(resolve(pluginRoot, relative), "utf8");
    assert.equal((text.match(/type: "mcp"/g) ?? []).length, 1);
    assert.match(text, /value: "oda-intelligence"/);
    assert.ok(text.includes(`url: "${gatewayUrl}"`));
  }
});

test("ChatGPT compatibility maps the registered gateway app without a secret", async () => {
  const codex = await readJson(
    "plugins",
    "oda-intelligence",
    ".codex-plugin",
    "plugin.json",
  );
  const app = await readJson(
    "plugins",
    "oda-intelligence",
    ".app.json",
  );

  assert.equal(codex.apps, "./.app.json");
  assert.deepEqual(Object.keys(app.apps), ["oda-intelligence"]);
  assert.deepEqual(app.apps["oda-intelligence"], {
    id: "asdk_app_6a6adfc09994819187cca37e0a256e7e",
  });
  assert.doesNotMatch(JSON.stringify(app), /plugin_asdk_app|authorization|token/i);
});

test("public repository contains exactly the reviewed file allowlist", async () => {
  const files = await listFiles(root);
  assert.deepEqual(files.toSorted(), expectedPublicFiles.toSorted());
});

test("public text contains no local path or unrelated owner repository URL", async () => {
  const files = await listFiles(root);
  const textFiles = files.filter((file) => !file.endsWith("package-lock.json"));
  for (const file of textFiles) {
    const text = await readFile(resolve(root, file), "utf8");
    assert.doesNotMatch(
      text,
      /(?:\/Users\/|\/private\/tmp\/|file:\/\/|\.secrets\/)/u,
      `local implementation path in ${file}`,
    );
    for (const match of text.matchAll(
      /https:\/\/github\.com\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)?/gu,
    )) {
      const url = new URL(match[0]);
      assert.ok(
        url.pathname === "/amnotyoung" ||
          url.pathname === "/amnotyoung/oda-intelligence-plugin",
        `unrelated owner repository URL in ${file}`,
      );
    }
  }
});

test("minimal accepted gateway contract contains 18 approved read-only tools", async () => {
  const contract = await readJson("contracts", "gateway-contract.json");
  assert.equal(Object.keys(contract.tools).length, 18);
  assert.ok(Object.values(contract.tools).every((tool) => tool.read_only));
  assert.equal(contract.gateway.url, gatewayUrl);
  assert.deepEqual(
    contract.compatibility_policy.forbidden_tools.toSorted(),
    [
      "compliance_radar",
      "get_article",
      "get_attachment",
      "get_trend_document",
      "list_attachments",
      "search_entity_relationships",
    ],
  );
});

test("observed lock pins exactly the 18 approved tool definitions", async () => {
  const contract = await readJson("contracts", "gateway-contract.json");
  const lock = await readJson("contracts", "observed.lock.json");
  assert.equal(lock.schema_version, 1);
  assert.equal(lock.gateway.url, gatewayUrl);
  assert.equal(lock.gateway.server_name, "oda-intelligence");
  assert.equal(lock.gateway.tool_count, 18);
  assert.deepEqual(
    Object.keys(lock.gateway.tools).toSorted(),
    Object.keys(contract.tools).toSorted(),
  );
  assert.match(lock.gateway.instructions_sha256, /^[a-f0-9]{64}$/u);
  assert.ok(
    Object.values(lock.gateway.tools).every((hash) =>
      /^[a-f0-9]{64}$/u.test(hash),
    ),
  );
});
