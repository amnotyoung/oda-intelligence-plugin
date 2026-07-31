#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const arguments_ = process.argv.slice(2);
const reportArgument = arguments_[0];
if (!reportArgument) {
  console.error(
    "Usage: node validate-report.mjs <report-path> [--map-selection <selection.json>]",
  );
  process.exit(2);
}
const mapSelectionOptionIndex = arguments_.indexOf("--map-selection");
if (
  mapSelectionOptionIndex !== -1
  && (
    !arguments_[mapSelectionOptionIndex + 1]
    || arguments_[mapSelectionOptionIndex + 1].startsWith("--")
  )
) {
  console.error("--map-selection requires a JSON path.");
  process.exit(2);
}
const mapSelectionArgument =
  mapSelectionOptionIndex === -1
    ? null
    : arguments_[mapSelectionOptionIndex + 1];

const reportPath = resolve(process.cwd(), reportArgument);
let report;
try {
  report = await readFile(reportPath, "utf8");
} catch (error) {
  console.error(`Cannot read report: ${error.message}`);
  process.exit(2);
}

let mapSelection = null;
if (mapSelectionArgument) {
  const mapSelectionPath = resolve(process.cwd(), mapSelectionArgument);
  try {
    mapSelection = JSON.parse(await readFile(mapSelectionPath, "utf8"));
  } catch (error) {
    console.error(`Cannot read map selection: ${error.message}`);
    process.exit(2);
  }
}

const requiredHeadings = [
  "## 1. 국가 개황",
  "## 2. 개발협력 환경 해석",
  "## 3. 국제 원조지형",
  "## 4. 한국 개발협력 포트폴리오",
  "## 5. 우선 협력분야",
  "## 6. 사업 참여·파트너·조달 여건",
  "## 7. 주요 위험과 Go/No-Go 조건",
  "## 8. 미주: 자료 품질과 해석 한계",
  "## 9. 핵심 출처",
];

const requiredSubheadings = [
  "### 1.1 표준 국가 프로필",
  "### 1.2 주요 사회경제지표",
  "### 2.1 정치·거버넌스 환경",
  "### 2.2 경제·사업환경",
  "### 2.3 인도적·보건 환경",
  "### 6.1 현실적인 참여경로",
  "### 6.2 파트너 실사",
  "### 6.3 조달·계약 통제",
];

const forbiddenPatterns = [
  [/\b90일 실행안\b/u, "90-day action plan"],
  [/사업 참여 검토 30일 준비 순서/u, "30-day preparation sequence"],
  [/독자별 이용 가이드/u, "audience-specific reading guide"],
  [/\bMCP\b/u, "MCP implementation detail"],
  [/API\s*키/iu, "API credential detail"],
  [/키체인/u, "credential-storage detail"],
  [/\bcached_at\b/iu, "cache metadata"],
  [/\bcache_hit\b/iu, "cache metadata"],
  [/쿼리문/u, "query implementation detail"],
  [/개발 로그/u, "development log"],
  [/\b(?:localhost|127\.0\.0\.1)\b/iu, "local server detail"],
  [/문서\s*(?:ID|아이디)/iu, "internal document identifier"],
  [/`[0-9a-f]{12,}`/iu, "raw internal identifier"],
  [
    /종합\s*판단[^\n]*(?:조건부\s*)?(?:Go|No-Go)/iu,
    "unsolicited report-wide Go/No-Go conclusion",
  ],
];

const errors = [];
let previousIndex = -1;
for (const heading of requiredHeadings) {
  const index = report.indexOf(heading);
  if (index === -1) {
    errors.push(`Missing heading: ${heading}`);
  } else if (index < previousIndex) {
    errors.push(`Heading is out of order: ${heading}`);
  } else {
    previousIndex = index;
  }
}

for (const heading of requiredSubheadings) {
  if (!report.includes(heading)) errors.push(`Missing subheading: ${heading}`);
}

const firstNumberedHeading = report.match(/^## \d+\..+$/mu)?.[0] ?? null;
if (firstNumberedHeading !== requiredHeadings[0]) {
  errors.push("The first numbered section must be 국가 개황.");
}

for (const [pattern, label] of forbiddenPatterns) {
  if (pattern.test(report)) errors.push(`Reader-facing report contains ${label}.`);
}

if (!/\|\s*지표\s*\|[^\n]*관측연도[^\n]*출처\s*\|/u.test(report)) {
  errors.push("The report does not expose observation years for quantitative data.");
}
const hasInsufficientEvidenceSignal =
  /(?:\b(?:no_data|disabled|error)\b|비활성|조회 오류|자료[가-힣\s]*(?:없|부족)|미확인|확인되지 않)/iu.test(
    report,
  );
if (hasInsufficientEvidenceSignal && !report.includes("판단 불충분")) {
  errors.push("The report does not define or use 판단 불충분 for insufficient evidence.");
}
if (!/\]\(https?:\/\/[^)]+\)/u.test(report)) {
  errors.push("The report does not contain direct web citations.");
}

const visualizationPattern =
  /```mermaid[\s\S]*?```|!\[[^\]]+\]\([^)]+\)/gu;
const visualizations = [...report.matchAll(visualizationPattern)];
const visualizationWaiver = report
  .split("\n")
  .find((line) => line.trim().startsWith("시각화 예외:"));
if (
  visualizations.length < 2 &&
  (!visualizationWaiver ||
    visualizationWaiver.replace(/^.*?시각화 예외:\s*/u, "").trim().length < 20)
) {
  errors.push(
    "The report contains fewer than two evidence-bearing visualizations and no specific visualization waiver.",
  );
}

for (const [index, visualization] of visualizations.entries()) {
  const start = visualization.index + visualization[0].length;
  const nextVisualizationIndex =
    visualizations[index + 1]?.index ?? report.length;
  const nextHeadingMatch = report.slice(start).match(/^##+\s/mu);
  const nextHeadingIndex = nextHeadingMatch
    ? start + nextHeadingMatch.index
    : report.length;
  const end = Math.min(start + 1_200, nextVisualizationIndex, nextHeadingIndex);
  const caption = report.slice(start, end);
  const hasSource = /(?:출처|자료)\s*:/u.test(caption);
  const hasUnit =
    /(?:단위|(?:\d[\d,.]*|[일이삼사오육칠팔구십백천만억]+)\s*(?:건|명|개|%|달러|㎢|km²|백만))/iu.test(
      caption,
    );
  const hasTime =
    /(?:관측기간|관측연도|기준일|\d{4}년|\d{4}-\d{2}(?:-\d{2})?)/u.test(
      caption,
    );
  const hasCoverage =
    /(?:포함범위|범위|전체|가운데|중|대상|고유 사업|진행)/u.test(caption);
  if (!hasSource || !hasUnit || !hasTime || !hasCoverage) {
    errors.push(
      `Visualization ${index + 1} lacks an adjacent source, unit, observation period/reference date, or coverage caption.`,
    );
  }
}

const localImages = [
  ...report.matchAll(/!\[([^\]]+)\]\((?!https?:\/\/|data:)([^)]+)\)/gu),
];
for (const match of localImages) {
  const relativePath = match[2].replace(/^<|>$/gu, "");
  const imagePath = resolve(dirname(reportPath), decodeURIComponent(relativePath));
  try {
    await access(imagePath);
  } catch {
    errors.push(`Reader-facing report references a missing image: ${relativePath}`);
  }
}

function countValue(value) {
  return Number.parseInt(value.replaceAll(",", ""), 10);
}

const projectMaps = localImages.filter(
  (match) =>
    /(?:KOICA|한국)[^\]]*(?:사업|프로젝트)[^\]]*지도/iu.test(match[1])
    || /project-map/iu.test(match[2]),
);

let mapSelectionSummary = null;
if (mapSelection) {
  if (
    mapSelection.schema_version !== 1
    || !Array.isArray(mapSelection.projects)
    || mapSelection.projects.length === 0
  ) {
    errors.push(
      "Map selection must use schema_version 1 and account for active KOICA projects.",
    );
  } else {
    const identifiers = mapSelection.projects.map((project) => project?.project_id);
    const uniqueIdentifiers = new Set(identifiers);
    const invalidDecision = mapSelection.projects.some(
      (project) =>
        typeof project?.project_id !== "string"
        || project.project_id.trim() === ""
        || (project.include !== true && project.include !== false),
    );
    if (invalidDecision || uniqueIdentifiers.size !== identifiers.length) {
      errors.push(
        "Map selection contains a missing/duplicate project_id or an invalid include decision.",
      );
    } else {
      const mappedCount = mapSelection.projects.filter(
        (project) => project.include === true,
      ).length;
      const excludedCount = mapSelection.projects.length - mappedCount;
      mapSelectionSummary = {
        activeCount: mapSelection.projects.length,
        mappedCount,
        excludedCount,
      };
      if (mappedCount > 0 && projectMaps.length === 0) {
        errors.push(
          `Map selection identifies ${mappedCount} eligible projects, but the report omits the project map.`,
        );
      }
      if (mappedCount === 0 && projectMaps.length > 0) {
        errors.push(
          "Map selection identifies no eligible projects, but the report includes a project map.",
        );
      }
    }
  }
}

for (const [index, projectMap] of projectMaps.entries()) {
  const mapStart = projectMap.index;
  const sectionStart = report.lastIndexOf("\n## ", mapStart);
  const nextHeadingOffset = report.slice(mapStart).search(/\n## \d+\./u);
  const sectionEnd =
    nextHeadingOffset === -1 ? report.length : mapStart + nextHeadingOffset;
  const section = report.slice(Math.max(0, sectionStart), sectionEnd);
  const afterMap = report.slice(
    mapStart + projectMap[0].length,
    sectionEnd,
  );

  const coverage = section.match(
    /(?:기간상\s*)?(?:활동|진행)[^.\n]{0,160}?(\d[\d,]*)\s*건\s*중[^.\n]{0,240}?(\d[\d,]*)\s*건/u,
  );
  if (!coverage) {
    errors.push(
      `Project map ${index + 1} must state mapped and period-active project counts.`,
    );
  }

  const exclusion = section.match(
    /(\d[\d,]*)\s*건[^.\n]{0,240}?제외/u,
  );
  if (!exclusion) {
    errors.push(
      `Project map ${index + 1} must state the excluded project count.`,
    );
  }
  if (
    !/(?:국가\s*(?:중심점|참조점|기준점|폴백)|검증되지\s*않은\s*도시|도시\s*(?:표시점|지오코딩|기준점)|대상지역\s*(?:미확인|확인되지\s*않)|위치\s*(?:미확인|확인되지\s*않))/u.test(
      section,
    )
  ) {
    errors.push(
      `Project map ${index + 1} must state reader-facing exclusion reasons.`,
    );
  }
  if (
    !/(?:기간정보|기간상|사업기간)[^.\n]{0,160}?(?:계산|파생|대조)[^.\n]{0,160}?(?:실제\s*(?:집행|운영)|운영상태)/u.test(
      section,
    )
  ) {
    errors.push(
      `Project map ${index + 1} must state that active status is period-derived, not confirmed operation.`,
    );
  }
  if (
    !/대상권역[^.\n]{0,160}?(?:시설|수혜자)[^.\n]{0,80}?좌표[^.\n]{0,80}?(?:아니|아님)/u.test(
      section,
    )
  ) {
    errors.push(
      `Project map ${index + 1} must state that target areas are not facility or beneficiary coordinates.`,
    );
  }

  const mappedTable = afterMap.match(
    /\|\s*지도 표시 사업\s*\|[^\n]*기간[^\n]*분야[^\n]*확인한 대상지역[^\n]*위치 근거[^\n]*\|\r?\n\|[\s:|-]+\|\r?\n((?:\|[^\n]+\|\r?\n?)+)/u,
  );
  if (!mappedTable) {
    errors.push(
      `Project map ${index + 1} must be followed by the exact mapped-project table.`,
    );
  } else if (coverage) {
    const mappedCount = countValue(coverage[2]);
    const tableRowCount = mappedTable[1]
      .trim()
      .split(/\r?\n/u)
      .filter((line) => line.startsWith("|")).length;
    if (tableRowCount !== mappedCount) {
      errors.push(
        `Project map ${index + 1} states ${mappedCount} mapped projects but its table has ${tableRowCount} rows.`,
      );
    }
  }

  if (coverage && exclusion) {
    const activeCount = countValue(coverage[1]);
    const mappedCount = countValue(coverage[2]);
    const excludedCount = countValue(exclusion[1]);
    if (mappedCount + excludedCount !== activeCount) {
      errors.push(
        `Project map ${index + 1} counts do not reconcile: ${mappedCount} mapped + ${excludedCount} excluded != ${activeCount} active.`,
      );
    }
    if (
      index === 0
      && mapSelectionSummary
      && (
        activeCount !== mapSelectionSummary.activeCount
        || mappedCount !== mapSelectionSummary.mappedCount
        || excludedCount !== mapSelectionSummary.excludedCount
      )
    ) {
      errors.push(
        `Project map counts do not match the technical selection: report ${mappedCount}/${activeCount} mapped and ${excludedCount} excluded; selection ${mapSelectionSummary.mappedCount}/${mapSelectionSummary.activeCount} mapped and ${mapSelectionSummary.excludedCount} excluded.`,
      );
    }
  }
}

const mapClaim =
  report
    .split("\n")
    .find(
      (line) =>
        line.includes("고유 사업") &&
        /(?:지도|ODA Map|Map Lab)/iu.test(line),
    ) ?? "";

if (errors.length > 0) {
  console.error(`Report validation failed: ${reportPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Report validation passed: ${reportPath}`);
