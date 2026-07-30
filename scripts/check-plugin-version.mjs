#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestRelatives = [
  "plugins/oda-intelligence/.codex-plugin/plugin.json",
  "plugins/oda-intelligence/.claude-plugin/plugin.json",
];

function numericVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
  if (!match) throw new Error(`Invalid plugin semver: ${version}`);
  return match.slice(1, 4).map(Number);
}

export function isVersionGreater(current, base) {
  const currentParts = numericVersion(current);
  const baseParts = numericVersion(base);
  for (let index = 0; index < currentParts.length; index += 1) {
    if (currentParts[index] !== baseParts[index]) {
      return currentParts[index] > baseParts[index];
    }
  }
  return false;
}

export function requiresVersionBump(paths) {
  return paths.some(
    (path) =>
      path === "plugins/oda-intelligence/.mcp.json" ||
      path === "plugins/oda-intelligence/.app.json" ||
      path === "plugins/oda-intelligence/.codex-plugin/plugin.json" ||
      path === "plugins/oda-intelligence/.claude-plugin/plugin.json" ||
      path === "contracts/gateway-contract.json" ||
      path === "contracts/observed.lock.json" ||
      path === ".claude-plugin/marketplace.json" ||
      path.startsWith("plugins/oda-intelligence/skills/"),
  );
}

async function main() {
  const baseBranch = process.env.GITHUB_BASE_REF?.trim();
  if (!baseBranch) {
    console.log("Plugin version comparison skipped outside a pull request.");
    return;
  }
  const baseRef = `origin/${baseBranch}`;
  const changedPaths = execFileSync(
    "git",
    ["diff", "--name-only", `${baseRef}...HEAD`],
    { cwd: repositoryRoot, encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
  if (!requiresVersionBump(changedPaths)) {
    console.log("No versioned plugin component changed.");
    return;
  }

  let compared = 0;
  for (const manifestRelative of manifestRelatives) {
    let baseManifest;
    try {
      baseManifest = JSON.parse(
        execFileSync("git", ["show", `${baseRef}:${manifestRelative}`], {
          cwd: repositoryRoot,
          encoding: "utf8",
        }),
      );
    } catch {
      continue;
    }
    const currentManifest = JSON.parse(
      await readFile(resolve(repositoryRoot, manifestRelative), "utf8"),
    );
    if (!isVersionGreater(currentManifest.version, baseManifest.version)) {
      throw new Error(
        `Versioned plugin files changed, but ${manifestRelative} version ${currentManifest.version} is not greater than ${baseManifest.version}.`,
      );
    }
    compared += 1;
    console.log(
      `${manifestRelative}: ${baseManifest.version} -> ${currentManifest.version}`,
    );
  }
  if (compared === 0) {
    console.log("Plugin is new on this branch; initial versions are accepted.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
