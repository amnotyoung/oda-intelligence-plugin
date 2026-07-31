# Country report standard

## Required structure

Use these top-level sections in this order:

1. 국가 개황
2. 개발협력 환경 해석
3. 국제 원조지형
4. 한국 개발협력 포트폴리오
5. 우선 협력분야
6. 사업 참여·파트너·조달 여건
7. 주요 위험과 Go/No-Go 조건
8. 미주: 자료 품질과 해석 한계
9. 핵심 출처

## Section requirements

### 1. 국가 개황

Start the substantive report with facts, not recommendations.

#### 1.1 표준 국가 프로필

Include:

- Korean and English names, ISO2 and ISO3
- capital and region
- surface area in square kilometres
- currency and official language
- constitutional form of state and government
- effective governance situation as of the reference date

Keep the constitutional and effective systems in separate rows or sentences.

#### 1.2 주요 사회경제지표

Include:

- population
- nominal GDP
- GDP per capita
- real GDP growth
- World Bank income group
- additional social or health indicators only when useful

Attach the observation year, unit, and source to each value. Do not arrange values from different years as if they describe one common moment.

### 2. 개발협력 환경 해석

Use these subsections:

- 정치·거버넌스 환경
- 경제·사업환경
- 인도적·보건 환경

Explain program consequences here instead of contaminating the country profile with recommendations.

### 3. 국제 원조지형

Show comparable OECD DAC CRS figures separately from IATI activity records. Explain coverage and duplication. Do not interpret missing records as absence of assistance.

In a Korean report, render IATI `pipeline/identification` as `사업 계획·준비 단계`, not `파이프라인`. At first use, explain that it means an activity reported as being identified or planned and does not establish approval, secured funding, a solicitation, or a contract.

### 4. 한국 개발협력 포트폴리오

Distinguish:

- unique projects from mapped entities
- date-derived active status from confirmed operational status
- KOICA projects from other Korean agencies
- source-reported coordinates from fallback or geocoded display points

Omit aggregate or individual map budgets when currency is absent or conflicting.

For document-based claims, write the exact document title and link directly to the original when available. Keep document, corpus, and search-result IDs in the technical snapshot; do not expose them in the report.

Link the public map at the first sentence that reports a map-derived count. If the service has no stable country deep link, tell the reader which country name to search.

Include at least two evidence-bearing visualizations when the data supports them. Useful defaults are portfolio status, implementing-agency composition, aid trends, sector composition, and geographic distribution. Every visual must state its source, unit, observation period, and coverage, and retain exact values in adjacent text or a table.

A visualization must materially reduce interpretation effort. Do not chart one or two observations, visualize a small comparison that is already obvious from a compact table or sentence, or duplicate the same conclusion in both a visual and adjacent text. Prefer a visual only when it exposes a distribution, trend, composition, geography, concentration, outlier, or relationship that otherwise takes meaningful effort to infer.

When a Korean project-location map is available, place it beside the period-active KOICA project table. State how many projects were mapped out of the active-project denominator. Omit projects whose target location cannot be verified, explain the exclusion count, and never plot fallback or reference coordinates as project sites.

### 5. 우선 협력분야

Use a comparison table with:

- priority sector
- demand and portfolio evidence
- suitable approach
- approach to avoid or major constraint

Make the recommendation traceable to evidence from earlier sections.

### 6. 사업 참여·파트너·조달 여건

Describe structural routes, not a list of current solicitations:

- technical and evaluation services
- consortium or local implementation
- supply and logistics
- research and knowledge cooperation
- independent or remote monitoring

State due-diligence requirements and contract controls. Do not imply that a historical relationship or active project is an open procurement opportunity.

Use these subsections:

- 현실적인 참여경로
- 파트너 실사
- 조달·계약 통제

Visualize a participation or procurement route only when official sources support the specific handoffs being drawn, and apply the visualization utility gate. When the sources support the rule but not the sequence, keep prose or a compact table.

### 7. 주요 위험과 Go/No-Go 조건

Use a table with:

- risk
- judgement
- mandatory control
- Go condition
- No-Go or suspension condition

Do not show a score when required sources are insufficient.
Do not add a report-wide `Go`, `Conditional Go`, or `No-Go` conclusion. Keep each condition scoped to a risk, region, delivery route, or project component.

### 8. 미주

Consolidate limitations instead of interrupting the narrative. Cover:

- statistical lag and mixed observation years
- IATI duplication and status ambiguity
- map location and budget limitations
- relationship-extraction limitations
- unavailable or failed sources
- hazard-boundary and risk-score limitations when relevant

### 9. 핵심 출처

List only sources used in the report. Prefer direct document pages over search pages and primary sources over commentary.

## Reader-facing style

- Write for a general professional reader without separate audience reading instructions.
- Put the conclusion after the evidence it depends on.
- Distinguish confirmed facts, source assessments, and recommendations.
- Use visualizations to clarify material comparisons, not as decoration.
- Do not combine values from different observation periods into one apparently contemporaneous visual.
- Use Mermaid for portable Markdown or an embedded SVG/PNG with descriptive alt text.
- Keep sentences direct and avoid tool or implementation jargon.
- Translate source-system status labels into plain reader-facing language; preserve the original code or label only in technical evidence unless it is needed for interpretation.
- Do not expose internal document IDs, corpus IDs, or search-result IDs.
- Use `판단 불충분` for unavailable evidence.
- Do not include a 90-day action plan or a 30-day preparation checklist.
