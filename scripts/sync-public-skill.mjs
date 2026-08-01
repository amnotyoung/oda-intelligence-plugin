#!/usr/bin/env node
// 공개 스킬을 상류 canonical에서 동기화한다.
//
// 이 저장소는 스킬 본문을 직접 쓰지 않는다. 상류가 생성한 공개 배포본을
// 그대로 받아 고정한다. 두 벌을 손으로 관리하면 상류가 바뀔 때마다 격차가
// 조용히 벌어지고, 그것이 이 파이프라인을 만든 이유다.
//
//   node scripts/sync-public-skill.mjs --source-dir <path> [--sha <commit>]
//   node scripts/sync-public-skill.mjs --check
//
// --check은 파일을 쓰지 않고 차이만 보고한다.

import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TARGET = resolve(
  ROOT,
  "plugins/oda-intelligence/skills/generate-development-country-report",
);
const LOCK_PATH = resolve(ROOT, "contracts/public-skill.lock.json");
const BUILD_SCRIPT = "scripts/build-public-skill.mjs";
const BUILD_OUTPUT = "dist/public-skill";

// 생성물에 남아서는 안 되는 이름. 상류 빌드도 같은 검사를 하지만, 이 저장소가
// 공개인 이상 받는 쪽에서도 확인한다. 한쪽 검사만 믿지 않는다.
const FORBIDDEN = [
  "overseas-procurement-100",
  "country-report-skill",
  "oda-map-lab",
  "devcoop-kg",
  "amnotyoung/oda-mcp",
  "io-mcp",
  ".dependency-source",
  "dependency-locks",
];

// 상류에서 받지 않는 것. agents/는 스킬 내용이 아니라 이 플러그인의 패키징이며,
// ChatGPT 앱 매핑처럼 배포처마다 다른 값을 담는다. 상류 사본으로 덮으면 게이트웨이
// 연결 선언이 사라진다.
const LOCAL_PATHS = [/^agents\//u];

function isLocal(file) {
  return LOCAL_PATHS.some((pattern) => pattern.test(file));
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function collect(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(directory, entry.name);
    files.push(
      ...(entry.isDirectory()
        ? await collect(full, base)
        : [full.slice(base.length + 1)]),
    );
  }
  return files.sort();
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fingerprint(directory) {
  const files = (await collect(directory)).filter((file) => !isLocal(file));
  const entries = {};
  for (const file of files) {
    entries[file] = digest(await readFile(join(directory, file), "utf8"));
  }
  return entries;
}

// 이미 공개된 사이트 주소는 은닉 대상이 아니다. 상류 스킬도 지도 근거를 제시할 때
// 이 주소를 쓰게 되므로, 검사 전에 주소만 지운다. 맨 이름은 여전히 걸린다.
// test/plugin-package.test.mjs가 같은 예외를 같은 이유로 적용한다.
const PUBLIC_SOURCE_URLS = [/https:\/\/oda-map-lab\.pages\.dev/gu];

function withoutPublicSourceUrls(text) {
  return PUBLIC_SOURCE_URLS.reduce(
    (value, pattern) => value.replaceAll(pattern, ""),
    text,
  );
}

async function assertNoPrivateNames(directory) {
  for (const file of await collect(directory)) {
    const text = withoutPublicSourceUrls(
      await readFile(join(directory, file), "utf8"),
    );
    const leaked = FORBIDDEN.filter((name) => text.includes(name));
    if (leaked.length > 0) {
      throw new Error(
        `Upstream public build still names a non-public asset in ${file}: ${leaked.join(", ")}`,
      );
    }
  }
}

function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

async function main() {
  const check = process.argv.includes("--check");
  const sourceDirectory = argument("--source-dir");
  if (!sourceDirectory) {
    throw new Error("--source-dir is required");
  }
  const built = resolve(sourceDirectory, BUILD_OUTPUT);
  await assertNoPrivateNames(built);

  const incoming = await fingerprint(built);
  const current = await fingerprint(TARGET).catch(() => ({}));
  const changed = JSON.stringify(incoming) !== JSON.stringify(current);

  if (check) {
    console.log(
      changed
        ? "Public skill differs from the upstream build."
        : "Public skill matches the upstream build.",
    );
    setOutput("changed", String(changed));
    if (changed) process.exitCode = 1;
    return;
  }

  if (changed) {
    for (const file of await collect(TARGET).catch(() => [])) {
      if (!isLocal(file)) await rm(join(TARGET, file));
    }
    for (const file of Object.keys(incoming)) {
      const target = join(TARGET, file);
      await mkdir(resolve(target, ".."), { recursive: true });
      await cp(join(built, file), target);
    }
  }

  const lock = {
    schema_version: 1,
    source_ref: "main",
    source_sha: argument("--sha") ?? null,
    build_script: BUILD_SCRIPT,
    files: Object.keys(incoming).length,
    fingerprint: digest(JSON.stringify(incoming)),
  };
  await writeFile(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`);

  console.log(
    changed
      ? `Synced ${Object.keys(incoming).length} public skill files from upstream.`
      : "Public skill already matches the upstream build.",
  );
  setOutput("changed", String(changed));
}

await main();
