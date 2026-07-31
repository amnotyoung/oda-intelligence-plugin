---
name: generate-development-country-report
description: Generate or rewrite evidence-based development cooperation and ODA country reports, including polished DOCX deliverables, using country profiles, socioeconomic indicators, humanitarian evidence, aid flows, project portfolios, partner routes, ODA project-formation flows, procurement governance, and Go/No-Go risks. Use for country reports, Word reports, aid-landscape reviews, Korean ODA portfolio analysis, priority-sector selection, or partner and procurement entry analysis. Keep reader-facing prose separate from technical snapshots and never convert missing or failed data into zero or no risk.
---

# Generate a Development Country Report

Create a decision-useful country report for development cooperation without exposing collection logs, credentials, queries, or cache internals to the reader.

## Inputs and outputs

Determine these inputs from the request and workspace before asking questions:

- country name and ISO2/ISO3 codes
- reference date
- desired language
- existing report to preserve or revise
- available country-data, portfolio, document-search, and web research tools

When no output path is specified, write:

- report: `reports/<country-slug>-country-report-<yyyy-mm>.md`
- DOCX, when requested: `reports/<country-slug>-country-report-<yyyy-mm>.docx`
- technical evidence: `reports/data/<country-slug>-<source>-<yyyy-mm-dd>.json`

Use the validated Markdown report as the content source for DOCX generation unless the user supplies another source document. When revising an existing report, preserve it and add a version suffix unless the user explicitly authorizes overwriting.

## Required references

Read [references/report-standard.md](references/report-standard.md) before drafting.
Read [references/data-source-routing.md](references/data-source-routing.md) before collecting data.
Read [references/procurement-model-integration.md](references/procurement-model-integration.md) before writing section 6.
Read [references/docx-generation.md](references/docx-generation.md) before creating or revising a DOCX.
Start from [assets/country-report-template.md](assets/country-report-template.md) when creating a new report.

## Workflow

### 1. Gate on data status

Call `country_list` when available to resolve the requested country to a supported ISO2 code and country slug. `country_list` returns ISO2, ISO3, English and Korean names, the country slug, and the responsible KOICA office with its jurisdiction role; it carries no procurement data.
Then call `country_data_status` first. Record each source as `fresh`, `stale`, `no_data`, `disabled`, or `error`. Make a separate sufficiency decision for each report section: country profile, development environment, international aid, Korean portfolio, participation and procurement, and risk.

- Treat `no_data`, `disabled`, and `error` as `판단 불충분`, never as zero or no risk.
- Preserve `observed_at`, `fetched_at`, record counts, coverage, errors, and caveats only in a technical snapshot.
- Do not compute a risk score when required evidence is insufficient.
- Use a dated stale result only when its provenance remains clear.
- Do not let an overall `sufficient` status override a missing source required by one section. Record the affected section or claim as `판단 불충분`.
- Save the section-level gate and the sources required for each decision in the technical evidence.

If the status tool is unavailable, build an equivalent source-status table before interpreting evidence.

### 2. Build the standard country profile

Use World Bank country metadata and indicators for:

- name, ISO codes, capital, region, income group, lending type
- surface area
- population
- nominal GDP
- GDP per capita
- real GDP growth

Use verified official profiles for currency and official language. Separate the constitutional system from the effective governance situation as of the reference date. Put a year or reference date beside every value.

Do not place recommendations or development-cooperation interpretation in the profile.

### 3. Interpret the development environment

Use the latest authoritative economic, political, humanitarian, and health documents. Prefer primary sources such as World Bank, UN, OCHA, UNHCR, WHO, and official constitutional material.

Separate:

- political and governance conditions
- economic and operating conditions
- humanitarian and health conditions

Explain the program implications only after presenting the country profile. Do not repeat profile numbers unless the later argument requires them.

### 4. Map the international aid landscape

Use OECD DAC2A for comparable country-level ODA disbursement totals, OECD CRS for donor, sector, channel, or activity detail, and IATI for activity discovery.

- Never present an IATI search count as a unique project count.
- Do not label DAC2A observations as CRS. State the OECD dataset, measure, flow type, price basis, currency, unit multiplier, and observation year in technical evidence.
- Use CRS only when its additional detail materially supports the analysis; do not combine CRS activity rows into a country total when DAC2A provides the comparable aggregate.
- Distinguish IATI `pipeline/identification`, implementation, completion, and recent-update filters in the technical evidence.
- In a Korean reader-facing report, write `사업 계획·준비 단계` instead of the loanword `파이프라인`. At first use, explain that this is a reported status for an activity being identified or planned.
- State that `사업 계획·준비 단계` does not mean an approved budget, solicitation, or contract.
- Distinguish DAC flows from multilateral and non-DAC finance.

### 5. Analyze the Korean portfolio

When ODA Map tools are available, call them in this order:

1. `oda_map_data_status`
2. `oda_map_country_context`
3. `oda_map_projects`
4. `oda_map_project_detail`

Deduplicate repeated map locations by stable activity identifier. Do not aggregate a budget whose currency is missing or conflicting. Do not treat country fallback points or geocoded city centroids as project sites.

Use development-cooperation document search for project and institutional evidence. For every adopted document, cite:

- exact title
- direct original URL when available

Keep corpus IDs and search identifiers in the technical snapshot only. Never expose them in the reader-facing report. Treat extracted relationships as documentary signals, not independently verified current relationships.

Before including a project map, test every period-active KOICA project for coordinate eligibility using the same dated ODA Map snapshot:

- Account for every period-active KOICA project in a technical selection file.
- Exclude national fallback points, country reference points, and unverified city display points.
- Evaluate location evidence independently of the map coordinate scope: check source-reported locations, the Korean and English project titles, verified official documents, and human verification before excluding a project. A display point is not location evidence, but a title may still identify an eligible target area.
- For title-based evidence, record the exact target-area phrase from the title. Do not use a map display label alone, and do not mark a title-based location eligible when the title does not name it.
- Add English place names and known transliterations as resolver aliases. If one activity names multiple target areas, represent every supported area without distortion or exclude it with that reason.
- If no project has an eligible location, omit the map and report `0/<active denominator>` with the exclusion reasons.
- If eligible locations exist, apply the visualization utility gate before rendering. Render only locations supported by a source-reported project location, the project title, a verified official document, or human verification.

When no map renderer is available, omit the map and state the mapped numerator, active-project denominator, reference date, and limitations in prose or a table. Absence of a renderer is not absence of projects.

### 6. Derive priorities and participation routes

Select priority sectors using four tests:

- severity and scale of need
- complementarity with the existing portfolio
- feasible delivery and partner route
- ability to control conflict, safeguarding, sanctions, fiduciary, and access risk

Describe structural participation routes such as technical services, consortium delivery, local implementation, supply, research, and third-party monitoring. Do not list live notices unless the user explicitly asks for procurement opportunities.

Separate confirmed project or partner evidence from recommendations. Never imply that an existing partnership creates an open opportunity.

When supported country models exist, follow [references/procurement-model-integration.md](references/procurement-model-integration.md):

- Put a simplified `ODA 사업 발굴·형성 절차` diagram in section 6.1.
- Put a simplified `조달 거버넌스·감독체계` diagram in section 6.3.
- Cover the `입찰제도` model in section 6.3 as well, after the governance material. Governance answers who decides and who reviews; bidding answers how a tender is advertised, submitted, evaluated, and awarded. Present it as prose or a compact table.
- Do not make the bidding-system model a default third diagram. Add a bidding diagram only when the tender procedure cannot be stated accurately in prose, and never merge it into the governance diagram.

Section 6 rests on official law, regulations, procurement portals, financing agreements, and donor rules. Present verified funding-source, registration, method, publication, complaint, and oversight rules in prose or a compact table. Omit any diagram those sources do not support, and mark only the unresolved handoffs or institutional powers as `판단 불충분`.

### 7. Set Go/No-Go conditions

Cover at least:

- conflict, access, and staff safety
- human rights, sanctions, and diversion
- inflation, foreign exchange, fuel, and logistics
- disaster and health continuity
- partner and procurement integrity
- evidence quality and portfolio duplication

For each risk, state the judgement, mandatory controls, Go condition, and No-Go or suspension condition. Use `판단 불충분` when evidence cannot support a judgement.

Do not issue a single report-wide `Go`, `Conditional Go`, or `No-Go` conclusion. Do not append an overall entry judgement after the risk table. Keep conditions scoped to individual risks, regions, delivery routes, or project components.

### 8. Write the reader-facing report

Follow the nine-section order in the report standard. Keep collection mechanics out of the body.

Include at least two decision-useful visualizations when the supporting data allows them. Prefer trends, portfolio composition, geographic distribution, or risk comparisons that materially improve interpretation. When fewer than two visuals pass the utility and evidence gates, add a concise reader-facing `시각화 예외:` note explaining which comparable data or verified geography is unavailable; do not manufacture a chart to meet a count.

- Apply a visualization utility gate: keep a chart or map only when it makes a distribution, trend, composition, geography, concentration, outlier, or relationship materially easier to see than the adjacent prose or table.
- Do not visualize one or two observations, or a small comparison already obvious from a compact table or sentence.
- When a visual merely repeats the conclusion of adjacent text or a table, keep the clearer text or table and omit the visual.
- Use Mermaid for portable Markdown, or an embedded SVG/PNG with descriptive alt text when the target renderer does not support Mermaid.
- Put the source, unit, observation period, and population covered beside each visualization.
- Keep exact values in an adjacent table or concise text fallback.
- Do not visualize mixed observation periods as one contemporaneous comparison.
- Do not add decorative images that do not carry evidence.
- Hyperlink the public source at the first claim derived from an interactive map. If a stable country deep link is unavailable, link the map and state the country filter to apply.

Do not include:

- audience-specific reading guides
- API keys, credential storage, local server details, queries, cache timestamps, or development logs
- internal document IDs, corpus IDs, search-result IDs, or raw source identifiers that have no reader-facing meaning
- a 90-day action plan or 30-day preparation sequence
- unverified map budgets, approximate coordinates, or extracted relationships as settled facts

Move statistical lag, IATI duplication, map limitations, relationship extraction, and unavailable-source limitations into consolidated endnotes.

When the report cites KOICA internal rules:

- Use the KOICA regulation tools only for KOICA internal rules. Research statutes, presidential decrees, and ministry rules separately; an internal rule is not external law.
- Run the citation-verification tool against every final regulation citation before returning the report. Correct or remove a citation that comes back `not_found` or `unknown_source`.
- Do not treat a bounded search snippet as the complete governing article. Confirm a consequential conclusion against the current official source.

### 9. Produce DOCX when requested

Follow [references/docx-generation.md](references/docx-generation.md). Use the available document-creation skill and its workspace runtime rather than system Python or global packages.

- Preserve the validated report structure, hyperlinks, citations, tables, and evidence-bearing visuals.
- Apply explicit fonts and sizes to every run, including runs nested inside hyperlinks.
- Use Word-compatible built-in list styles instead of directly attaching custom numbering IDs to report paragraphs.
- Render the DOCX to page images, inspect every page, fix defects, and rerender before delivery.
- Deliver only the requested final artifact; keep rendered pages and PDFs as internal QA unless requested.

### 10. Save technical evidence separately

Save source responses, status metadata, and internal document identifiers outside the report. Do not expose secrets or credential identifiers in snapshots. Keep snapshots reproducible and date-stamped.

### 11. Validate

Run:

```bash
node <skill-directory>/scripts/validate-report.mjs <report-path>
```

When a period-active KOICA project selection file exists, run:

```bash
node <skill-directory>/scripts/validate-report.mjs <report-path> \
  --map-selection <map-selection.json>
```

Then verify:

- every quantitative value has a source, unit, and observation year
- every visualization has an adjacent evidence caption with its source, unit, observation period or reference date, and coverage
- the first substantive section is the standard country profile
- source dates are not visually presented as one common date
- adopted development-cooperation documents include the exact title and available original URL, without internal IDs
- at least two evidence-bearing visualizations are present when the data supports them; otherwise a specific `시각화 예외:` note explains the evidence limitation
- claims derived from an interactive map link to that map at the point of use
- an included project map states the mapped numerator, active-project denominator, exclusion count and reasons, period-derived status caveat, and target-area-not-site-coordinate caveat, and is followed by the exact mapped-project table
- a technical map selection with one or more included projects cannot pass validation when the reader-facing map is absent, and its included/excluded counts match the report
- unavailable evidence remains `판단 불충분`
- the report reads as a report, not a tool trace
- numbered endnotes and body lists remain separate Word paragraphs, restart independently of the contents list, and do not collapse into inline prose
- requested DOCX output passes the render, hyperlink-size, list-style, image, table-geometry, and archive-integrity checks in the DOCX reference
