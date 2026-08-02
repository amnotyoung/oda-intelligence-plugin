import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const pluginRoot = resolve(root, "plugins", "oda-intelligence");
const gatewayUrl = "https://oda-mcp.fly.dev/oda-intelligence/v2/mcp";
const expectedPublicFiles = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".github/workflows/ci.yml",
  ".github/workflows/update-gateway-contract.yml",
  ".github/workflows/sync-public-skill.yml",
  ".gitignore",
  "LICENSE",
  "PRIVACY.md",
  "README.en.md",
  "README.md",
  "SECURITY.md",
  "TERMS.md",
  "contracts/gateway-contract.json",
  "contracts/observed.lock.json",
  "docs/assets/install-demo.gif",
  "package-lock.json",
  "package.json",
  "plugins/oda-intelligence/.claude-plugin/plugin.json",
  "plugins/oda-intelligence/.app.json",
  "plugins/oda-intelligence/.codex-plugin/plugin.json",
  "plugins/oda-intelligence/.mcp.json",
  "plugins/oda-intelligence/skills/generate-development-country-report/SKILL.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/agents/openai.yaml",
  "plugins/oda-intelligence/skills/generate-development-country-report/assets/country-report-template.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/assets/render-chart.py",
  "plugins/oda-intelligence/skills/generate-development-country-report/build-manifest.json",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/chart-rendering.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/data-source-routing.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/docx-generation.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/procurement-model-integration.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/references/report-standard.md",
  "plugins/oda-intelligence/skills/generate-development-country-report/scripts/validate-report.mjs",
  "plugins/oda-intelligence/skills/koica-regulation-research/SKILL.md",
  "plugins/oda-intelligence/skills/koica-regulation-research/agents/openai.yaml",
  "plugins/oda-intelligence/skills/koica-regulation-research/references/research-protocol.md",
  "plugins/oda-intelligence/skills/korean-oda-portfolio-lookup/SKILL.md",
  "plugins/oda-intelligence/skills/korean-oda-portfolio-lookup/agents/openai.yaml",
  "plugins/oda-intelligence/skills/korean-oda-portfolio-lookup/references/portfolio-lookup-protocol.md",
  "contracts/public-skill.lock.json",
  "scripts/bump-plugin-version.mjs",
  "scripts/check-gateway-contract.mjs",
  "scripts/sync-public-skill.mjs",
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

test("plugin and every Skill depend on one credential-free gateway", async () => {
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
    "skills/korean-oda-portfolio-lookup/agents/openai.yaml",
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

// URL 검사만으로는 부족하다. `vendor/koica-project-map`이나 `oda-mcp` 같은 맨
// 이름은 github.com URL이 아니어서 그대로 통과한다. SECURITY.md의 저장소 경계
// 조항이 배제하는 것은 URL이 아니라 비공개 저장소의 이름 자체다.
// 공개 저장소만 링크할 수 있다. 사용자가 직접 설치해야 하는 것은 이름을 밝혀야
// 하지만, 비공개 저장소는 그 존재조차 드러내지 않는다.
//
// `ODA Map Lab`은 저장소 이름이 아니라 지도의 제품명이며, 다른 이유로 같은 목록에
// 있다. 지도는 어느 기관도 발행하지 않은 독립 취합물인데, 스킬 본문이 제품명을
// 들고 있으면 답변이 그것을 기관명과 붙여 `KOICA ODA Map Lab`처럼 인용한다.
// 소문자 `oda-map-lab`만 막아서는 이 표기가 통과한다.
const allowedRepositoryPaths = new Set([
  "/amnotyoung",
  "/amnotyoung/oda-intelligence-plugin",
  "/amnotyoung/koica-project-map",
  // README "Related tooling"이 가리키는 동반 프레임워크. 이 게이트웨이를
  // 선택적 증거원으로 쓰는 소비자이며, 역방향 의존은 없다.
  "/amnotyoung/dev-eval-agents",
  // koica-regulations 백엔드의 단독 배포판. 공개 저장소이므로(공개 확인:
  // 인증 없는 GET 200, GitHub API visibility=public) 출처 표의 공개 주소로
  // 밝힌다. 배제 조항이 겨냥하는 것은 비공개 저장소의 이름이다.
  "/amnotyoung/koica-reg-mcp",
]);

const forbiddenNames = [
  "overseas-procurement-100",
  "country-report-skill",
  "oda-map-lab",
  "ODA Map Lab",
  "devcoop-kg",
  "amnotyoung/oda-mcp",
  "io-mcp",
  ".dependency-source",
  "dependency-locks",
];

// 이미 공개된 사이트 주소는 은닉 대상이 아니다. 배제 조항이 겨냥하는 것은 비공개
// 저장소의 이름이지, 로그인 없이 열리는 웹사이트의 도메인이 아니다. 스킬은 지도
// 근거를 제시할 때 그 주소를 독자에게 보여야 하고, 독자가 원본을 열지 못하면 근거를
// 확인할 방법이 없다. 검사 전에 이 주소만 지우므로, 맨 이름은 여전히 실패한다.
const publicSourceUrls = [
  /https:\/\/oda-map-lab\.pages\.dev/gu,
  // 조달 모델의 공개 사이트. 로그인 없이 열리므로 은닉 대상이 아니지만, 경로에
  // 데이터셋 이름이 들어 있어 URL을 지우지 않으면 금칙어 검사에 걸린다. 접두사를
  // 요구하므로 맨 이름 `overseas-procurement-100`은 그대로 남아 계속 실패한다.
  /https:\/\/amnotyoung\.github\.io\/overseas-procurement-100(?:\/[\w./-]*)?/gu,
];

function withoutPublicSourceUrls(text) {
  return publicSourceUrls.reduce(
    (value, pattern) => value.replaceAll(pattern, ""),
    text,
  );
}

// 상류에서 동기화되는 스킬 본문과 계약 파일이 대상이다. README는 네 백엔드
// 식별자를 의도적으로 설명하고 있어 이 검사와 별개로 다룬다.
test("synced skill text contains no non-public repository or internal path name", async () => {
  const files = (await listFiles(root)).filter(
    (file) => file.startsWith("plugins/") || file.startsWith("contracts/"),
  );
  for (const file of files) {
    const text = withoutPublicSourceUrls(
      await readFile(resolve(root, file), "utf8"),
    );
    for (const name of forbiddenNames) {
      assert.ok(
        !text.includes(name),
        `${file} names a non-public asset: ${name}`,
      );
    }
  }
});

// 공개 도메인 예외가 맨 이름까지 열어주면 안 된다. 이 검사가 없으면 위 예외는
// 조용히 넓어진다.
test("the public source exception does not admit the bare private repository name", async () => {
  assert.equal(
    withoutPublicSourceUrls("see https://oda-map-lab.pages.dev for the map"),
    "see  for the map",
  );
  assert.equal(
    withoutPublicSourceUrls(
      "see https://amnotyoung.github.io/overseas-procurement-100/ for models",
    ),
    "see  for models",
  );
  assert.equal(
    withoutPublicSourceUrls(
      "model https://amnotyoung.github.io/overseas-procurement-100/model/nepal-bidding-system/ here",
    ),
    "model  here",
  );
  assert.ok(
    withoutPublicSourceUrls("overseas-procurement-100").includes(
      "overseas-procurement-100",
    ),
  );
  assert.ok(withoutPublicSourceUrls("oda-map-lab").includes("oda-map-lab"));
  assert.ok(
    withoutPublicSourceUrls("github.com/owner/oda-map-lab").includes(
      "oda-map-lab",
    ),
  );
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
        allowedRepositoryPaths.has(url.pathname),
        `unrelated owner repository URL in ${file}`,
      );
    }
  }
});

test("minimal accepted gateway contract contains 30 approved read-only tools", async () => {
  const contract = await readJson("contracts", "gateway-contract.json");
  assert.equal(Object.keys(contract.tools).length, 30);
  assert.ok(Object.values(contract.tools).every((tool) => tool.read_only));
  assert.equal(contract.gateway.url, gatewayUrl);
  // KOICA 규정 도구 4종은 v2 표면에 공개되었다. 규정 텍스트는 공공데이터포털
  // "한국국제협력단_정관 및 내부규정"(이용허락범위 제한 없음)으로 개방되어 있다.
  // 전체 표면이 공개되었다. 규정은 "정관 및 내부규정", 동향은 "국별 개발협력동향"
  // 개방 릴리스(공공데이터포털, 이용허락범위 제한 없음)가 재배포 근거다.
  for (const opened of [
    "compliance_radar",
    "get_article",
    "get_attachment",
    "list_attachments",
    "get_trend_document",
    "search_entity_relationships",
    "get_corpus_overview",
  ]) {
    assert.ok(opened in contract.tools, `${opened} must be an approved tool`);
  }
  assert.deepEqual(contract.compatibility_policy.forbidden_tools, []);
});

test("observed lock pins exactly the 30 approved tool definitions", async () => {
  const contract = await readJson("contracts", "gateway-contract.json");
  const lock = await readJson("contracts", "observed.lock.json");
  assert.equal(lock.schema_version, 1);
  assert.equal(lock.gateway.url, gatewayUrl);
  assert.equal(lock.gateway.server_name, "oda-intelligence");
  assert.equal(lock.gateway.tool_count, 30);
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

// 생성 스킬은 상류 canonical에서 받아 public-skill.lock.json이 지문으로 고정한다.
// 스킬 사본을 이 저장소에서 직접 고치면 lock이 조용히 뒤처지고, 다음 동기화가
// 그 수정을 상류 빌드로 되돌리거나 금지어 검사에서 멈출 때까지 아무도 모른다.
// 지문을 실제 디렉터리 내용과 대조해 그 드리프트를 이쪽 CI에서 잡는다.
//
// 계산 규칙은 scripts/sync-public-skill.mjs의 fingerprint와 같아야 한다. 그
// 스크립트는 로드 시점에 main()을 실행하므로 가져오지 않고 같은 규칙을 재현한다:
// agents/ 는 이 플러그인의 패키징이라 지문에서 빠진다.
test("public skill lock fingerprint matches the synced skill directory", async () => {
  const lock = await readJson("contracts", "public-skill.lock.json");
  const skillRoot = resolve(
    pluginRoot,
    "skills",
    "generate-development-country-report",
  );
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const files = (await listFiles(skillRoot)).filter(
    (file) => !file.startsWith("agents/"),
  );
  const entries = {};
  for (const file of files.toSorted()) {
    entries[file] = digest(await readFile(resolve(skillRoot, file), "utf8"));
  }
  assert.equal(lock.schema_version, 1);
  assert.equal(lock.files, Object.keys(entries).length);
  assert.equal(lock.fingerprint, digest(JSON.stringify(entries)));
});
