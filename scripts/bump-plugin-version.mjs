#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = resolve(
  repositoryRoot,
  "plugins",
  "oda-intelligence",
);
const codexManifestPath = resolve(pluginRoot, ".codex-plugin", "plugin.json");
const claudeManifestPath = resolve(pluginRoot, ".claude-plugin", "plugin.json");
const marketplacePath = resolve(repositoryRoot, ".claude-plugin", "marketplace.json");
const packagePath = resolve(repositoryRoot, "package.json");
const packageLockPath = resolve(repositoryRoot, "package-lock.json");

function numericVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
  if (!match) throw new Error(`Cannot bump non-semver plugin version: ${version}`);
  return match.slice(1, 4).map(Number);
}

const codexManifest = JSON.parse(await readFile(codexManifestPath, "utf8"));
const claudeManifest = JSON.parse(await readFile(claudeManifestPath, "utf8"));
const marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));
const packageMetadata = JSON.parse(await readFile(packagePath, "utf8"));
const packageLock = JSON.parse(await readFile(packageLockPath, "utf8"));
const codexVersion = numericVersion(codexManifest.version);
const claudeVersion = numericVersion(claudeManifest.version);
const packageVersion = numericVersion(packageMetadata.version);

if (
  new Set([
    codexVersion.join("."),
    claudeVersion.join("."),
    packageVersion.join("."),
  ]).size !== 1
) {
  throw new Error(
    "Claude, Codex, and package versions must share the same numeric version.",
  );
}

const nextVersion = `${codexVersion[0]}.${codexVersion[1]}.${codexVersion[2] + 1}`;
codexManifest.version = nextVersion;
claudeManifest.version = nextVersion;
packageMetadata.version = nextVersion;
packageLock.version = nextVersion;
packageLock.packages[""].version = nextVersion;

const marketplacePlugin = marketplace.plugins?.find(
  (plugin) => plugin.name === "oda-intelligence",
);
if (!marketplacePlugin) {
  throw new Error("Claude marketplace is missing oda-intelligence.");
}
marketplacePlugin.version = nextVersion;

await Promise.all([
  writeFile(codexManifestPath, `${JSON.stringify(codexManifest, null, 2)}\n`, "utf8"),
  writeFile(claudeManifestPath, `${JSON.stringify(claudeManifest, null, 2)}\n`, "utf8"),
  writeFile(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`, "utf8"),
  writeFile(packagePath, `${JSON.stringify(packageMetadata, null, 2)}\n`, "utf8"),
  writeFile(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`, "utf8"),
]);
console.log(nextVersion);
