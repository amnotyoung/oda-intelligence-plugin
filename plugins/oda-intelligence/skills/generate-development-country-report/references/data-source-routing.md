# Data source routing

## Collection order

1. Resolve country codes and reference date.
2. Check source status and coverage.
3. Collect the standard country profile.
4. Collect current political, economic, humanitarian, and health documents.
5. Collect OECD and IATI aid evidence.
6. Collect the Korean portfolio and project details.
7. Search development-cooperation documents and relationships.
8. Collect country-specific ODA project-formation and procurement-governance evidence.
9. Collect hazard signals when they affect operating conditions.
10. Write technical snapshots.
11. Draft the report.

## Source map

| Need | Preferred source | Rules |
|---|---|---|
| Country metadata | World Bank country metadata | Use name, codes, capital, region, income group, and lending type |
| Area | World Bank `AG.SRF.TOTL.K2` | Include square kilometres and observation year |
| Population | World Bank `SP.POP.TOTL` | Include observation year |
| Nominal GDP | World Bank `NY.GDP.MKTP.CD` | Use current USD and observation year |
| GDP per capita | World Bank `NY.GDP.PCAP.CD` | Use current USD and observation year |
| Real GDP growth | World Bank `NY.GDP.MKTP.KD.ZG` | Distinguish calendar-year observations from fiscal-year forecasts |
| Currency and language | Verified official country profile | Prefer UN or constitutional material |
| Political system | Constitution and current UN or official documents | Separate de jure form from effective control |
| Economic operating environment | Latest World Bank country economic monitor | Confirm publication date and forecast period |
| Humanitarian needs | OCHA plans and updates, HDX HAPI | Do not add overlapping sector or administrative totals |
| Forced displacement | UNHCR Refugee Data Finder | Separate origin, asylum, refugee, asylum-seeker, IDP, and returnee categories |
| Health | WHO emergency appeals and GHO | Distinguish current emergency estimates from lagged indicators |
| Humanitarian documents | ReliefWeb and UN country pages | Treat metadata search as discovery; read the original document |
| Finalized country-level ODA flows | OECD DAC2A | Use the recipient-country aggregate; state measure, currency, price basis, flow type, unit multiplier, and year |
| Donor, sector, channel, or activity detail | OECD CRS | Use for disaggregated analysis; do not relabel DAC2A as CRS or reconstruct a country total when DAC2A is available |
| Activity discovery | IATI | Counts are records, not unique projects |
| Korean portfolio | Unofficial Korean ODA location map | Deduplicate by activity ID; inspect project details; cite it as unofficial and name no agency as its publisher |
| Korean project documents | Development-cooperation document corpus | Cite the exact title and direct original URL when present; keep internal IDs in the technical snapshot |
| ODA project-formation route | `procurement_model_detail` with `axis: "pipeline"` | In Korean prose call it `사업 발굴·형성 절차`; inspect `verification` and `unresolved`; verify material claims from the linked primary sources |
| Procurement governance and oversight | `procurement_model_detail` with `axis: "governance"` | Distinguish domestic and external funding routes, responsible authorities, contracting bodies, and oversight; retain provisional or unresolved legal details |
| Bidding system | `procurement_model_detail` with `axis: "bidding"` | Covers advertisement, submission, evaluation, and award; belongs in section 6.3 after governance and is normally prose or a table rather than a diagram |
| Procurement route when no country model is available | National procurement law and portal, financing agreements, donor procurement rules | Verify only what the sources support; separate confirmed law from unresolved institutional handoffs; a missing model is not evidence that no formal process exists |
| Sketch map background | `country_map_outline` | Simplified outer rings for a report figure; scale to the returned bounds and never use them for area, distance, or boundary judgements |
| Disaster signals | USGS, GDACS, NASA EONET | Deduplicate comparable events; a bounding-box hit is not a site risk rating |

## Tool sequence

Use the first four tools from the pinned country-data MCP contract and the remaining tools from their named providers:

1. `country_data_status`
2. `country_report_context`
3. `country_humanitarian_context` when more humanitarian detail is needed
4. `country_hazard_snapshot` when disaster signals affect the report
5. `oda_map_data_status`
6. `oda_map_country_context`
7. `oda_map_projects`
8. `oda_map_project_detail`
9. development-cooperation document and relationship search
10. `procurement_model_status`, then `procurement_country_context` or `procurement_model_detail`

If a named tool is unavailable, use an equivalent authoritative source. Do not silently replace an unavailable value with zero.

ACLED is intentionally disabled in the country-data MCP contract. Do not request ACLED credentials, call an undeclared ACLED tool, or interpret the disabled source as zero conflict events.

For section 6, call `procurement_model_status` first, then retrieve the axes the section needs. Follow [procurement-model-integration.md](procurement-model-integration.md). A missing model is `no_data`, not evidence that no formal route or governance system exists.

## Status semantics

| Status | Meaning | Report treatment |
|---|---|---|
| `fresh` | Within the source-specific freshness window | Use with normal caveats |
| `stale` | Valid but older than the desired window | Use only with observation date and limitation |
| `no_data` | Query succeeded but required evidence is absent | `판단 불충분`; do not write zero |
| `disabled` | Source is not configured or available | `판단 불충분`; seek an official substitute |
| `error` | Retrieval failed | Use dated fallback if valid; otherwise `판단 불충분` |

`PUBLIC_RESPONSE_BLOCKED` is not a status in that table. It means the gateway withheld one response, and it says nothing about whether the evidence exists — the source status for the same country is often `fresh`. Narrow the request (fewer sections, smaller sample, a different tool covering the same field) before recording anything as `판단 불충분`, and record only the fields still missing after that. When the source status is `fresh` and a response stays blocked, tell the reader it is a gateway limitation rather than a data gap.

## Section-level sufficiency gate

Do not use the overall source status as the report decision. Save this gate in technical evidence before drafting:

| Report area | Minimum evidence | If missing |
|---|---|---|
| Country profile | country metadata plus dated socioeconomic observations | Mark only missing profile fields `판단 불충분` |
| Development environment | current political/governance, economic, and humanitarian/health evidence | Mark the unsupported subsection or claim `판단 불충분` |
| International aid | DAC2A aggregate or a clearly labelled substitute; IATI only for activity discovery | Do not infer aid volume from IATI counts |
| Korean portfolio | dated portfolio status, deduplication key, project status, agency and sector coverage | Do not infer unique projects, budgets, or active status |
| Participation and procurement | official law or regulation, funding-source rule, contracting route, and complaint or oversight evidence | Omit unsupported process diagrams; mark unresolved handoffs |
| Risk | current evidence for each material risk named in section 7 | Do not score the risk; use a scoped `판단 불충분` |

An overall `sufficient` result can coexist with an insufficient section. Preserve that distinction.

## Evidence rules

- Preserve the source's definition, unit, geography, period, and revision date.
- Prefer the latest authoritative document, but do not overwrite older baseline indicators without explaining the different definitions.
- Keep data collection metadata in snapshots, not the report.
- Never expose credentials, credential identifiers, subscription values, or raw error bodies.
- Keep document IDs, corpus IDs, and search-result identifiers in technical snapshots, not reader-facing prose.
- Cite direct original URLs beside material claims.
- Treat a procurement model page as a visual synthesis and the model itself as a structured secondary source. Cite the model used for the diagram and the underlying official or primary sources used for material factual claims.
- Link an interactive map at the first map-derived count and state the country filter when no stable deep link exists.
- Mark an inference as an inference.

## Development-document citation

Use this form:

```text
[「정확한 문서 제목」](https://original.example/document)
```

If no original URL exists:

```text
「정확한 문서 제목」(원문 공개 URL 미확인)
```

Preserve the internal document identifier in the dated technical evidence snapshot so the source can be reproduced without burdening the reader.

Do not claim that an extracted relationship has been externally verified.
