---
name: international-oda-data-lookup
description: Answer targeted international ODA and development-finance questions using OECD DAC/DAC2A/CRS, IATI, World Bank, and local development-document or project evidence. Use for DAC or CRS purpose/sector code meanings and lists, applied code selection for a proposed or named project, a publisher's current IATI-reported sector, evidence of an official OECD CRS submission for an existing project, recipient-country ODA totals, donor/sector/channel/activity detail, and IATI discovery or filtering. When an applied classification question names a recipient country, subnational place, or project, gather that geography and project evidence before recommending a code. Do not use for standalone Korean agency project inventories, KOICA internal regulations, or a full country-report deliverable.
---

# Look Up International ODA Data

Route the question by evidence type before calling a tool. Distinguish a standalone code-table
question from an applied classification question: the latter needs the project's geographic and
design facts before the official code list can be interpreted.

## Route the request

1. **Applied DAC/CRS classification for a named geography or project** — follow
   `Geography-first applied classification` below before calling `dac_purpose_code_lookup`.
2. **Standalone DAC/CRS code meaning or code list** — call `dac_purpose_code_lookup`. Use `code` for an exact
   three- or five-digit code, or `query` for an official-English-label search, but never both in
   one call. For a three-digit branch, set `includeChildren=true`. The tool reads the official OECD
   SDMX `CL_DAC_SECTOR` codelist. Never call `search_regulation` for this task.
3. **Comparable recipient-country ODA total** — resolve the ISO2 country code, call
   `country_data_status`, then call `country_report_context`. Label the OECD observations as DAC2A,
   not CRS.
4. **IATI activity, transaction, or budget discovery** — call `iati_status`, then
   `iati_query_country`. Pass the recipient ISO2 code and request only the fields needed. For an
   existing activity's current IATI-reported sector, use an identifier-scoped
   `collection: "activity"` query and request `activity_sectors` plus
   `activity_sectors_truncated`. Require one verified match and read its returned canonical
   `iati_identifier`; never invent an identifier prefix. If
   `activity_sectors` is empty, check transaction-level sector evidence because IATI permits sector
   reporting at either activity level or for every transaction.
5. **OECD CRS donor, sector, channel, or activity detail** — use the current official OECD Data
   Explorer or OECD API through an available web or browser tool. The gateway has no dedicated CRS
   detail query. An IATI sector does not by itself prove what was submitted to the OECD CRS database;
   do not substitute an IATI count or record for OECD CRS evidence.

If `dac_purpose_code_lookup` is absent from the current tool snapshot, explain that the gateway
upgrade is not active in this conversation and use the official OECD API through an available web
or browser tool. If the user explicitly requires gateway-only evidence for route 5, state the
unsupported operation directly. Do not search an unrelated gateway source, invent a result, or
imply that an empty response proves the code or flow does not exist.

## Geography-first applied classification

When the user asks which DAC/CRS code fits a project and names a geography or an existing project,
treat the name as a routing input rather than decorative context. An explicit request for a CRS
code does not override this order. Choose the most specific matching route: a named Korean project
before a subnational place, and a subnational place before a country-and-topic search. Combine
routes only when the less-specific search can supply a design fact the more-specific record lacks.

1. **User-supplied IATI identifier or named non-Korean activity** — if the request already contains a
   verified IATI identifier, query it directly with the known recipient ISO2 code. For a named
   non-Korean activity without an identifier, resolve one from the publisher's public IATI record,
   d-portal, or official OECD activity evidence before making an assignment claim. Do not route it
   through the Korean ODA Map and do not manufacture an identifier from the title.
2. **Named Korean or KOICA project** — call `oda_map_data_status`, find the project with
   `oda_map_projects` while requesting `description` and `source`, and read the material record with
   `oda_map_project_detail`. Use the recipient country from the request or conversation because
   `oda_map_projects` is country-scoped. If the user supplied a stable `project_id`, call detail
   directly; if neither a country nor an identifier is available, ask for the recipient country
   rather than pretending there is a cross-country title search. Use `korean-oda-portfolio-lookup`
   for the source and field rules.
3. **City, province, state, county, district, or other subnational place** — call
   `search_development_by_place` first with the exact `place`, plus any stated country and topic.
   Inspect `resolved_places` and disambiguate before using either evidence branch. Follow a material
   document with `get_trend_document` and a material mapped project with
   `oda_map_project_detail` before classifying; the place result itself is shallow discovery.
4. **Recipient country plus project topic** — call `search_offices_by_topic` first with the user's
   country wording in `country` and the project topic in `query`. Follow material hits with
   `search_development_trends`, passing both the returned `office` and the same original `country`
   filter, then `get_trend_document` when the content can distinguish candidate codes. Offices can
   cover concurrent countries, so dropping the country filter can retrieve evidence for the wrong
   recipient. A country name is not a subnational place: do not pass `피지` or another country name
   as `place` merely because it appears before the topic.
5. Only after the relevant context call `dac_purpose_code_lookup`. Base the recommendation on the
   project's principal purpose and verified design facts, not on the geography alone. If a choice
   depends on a still-unknown fact — for example centralised-grid versus isolated or standalone
   solar — give conditional candidates and name the fact required to choose. If the user asks which
   code an existing activity was actually reported under in IATI, a recommendation is not enough.
   After the map identifies a Korean activity, remove only a literal leading `iati:` namespace from
   its verified `project_id` and pass the remainder as `iatiIdentifier`; never synthesize a reporting-
   organisation prefix. Call `iati_status`, then query `iati_query_country` with
   `collection: "activity"`, the recipient ISO2 code, `summary: false`, and fields including
   `iati_identifier`, `title_narrative`, `recipient_country_code`, `activity_sectors`,
   `activity_sectors_truncated`, and `last_updated_datetime`. Require
   `total_found: 1`, then verify the returned canonical `iati_identifier`, title, and recipient before
   using the record. Report every vocabulary `1` sector and its percentage; vocabulary `1` may be
   explicit or the IATI default indicated by `vocabulary_inferred`. Verify every returned code's
   official label with `dac_purpose_code_lookup`. If `activity_sectors_truncated` is true, say the
   result is partial and inspect the publisher XML before claiming a complete assignment list.
6. If the current tool snapshot does not expose `activity_sectors`, or the matched activity record
   omits that field even though it was requested, do not probe guessed parent codes. Open the matched
   activity in the publisher's public IATI XML or d-portal activity HTML/XML instead. A present empty
   array means the structured current activity record was read but has no activity-level sector; it
   does **not** prove that IATI has no sector because the standard permits sector reporting for every
   transaction instead. Query `collection: "transaction"` with the returned canonical identifier only
   for discovery; `transaction_sector_code` alone does not preserve its vocabulary association and
   must never be labelled CRS. Verify the structured transaction sector and vocabulary together in
   the publisher XML or d-portal before calling it a CRS code. If neither level can be read, report that the assignment
   field is unavailable; do not report that the publisher omitted a code.

For example, `피지에서 태양광 사업 하려는데 CRS 코드 뭐 써야 하냐` routes through the Fiji
development-document corpus for solar evidence before the solar-purpose-code lookup. The local
evidence helps interpret the alternatives; it does not itself assign an official CRS code.

An empty place or document search means only that the indexed local evidence did not answer the
question. It does not prove that the place, project, or design feature is absent. Continue from
verified user-supplied facts, state the evidence gap, and keep any code choice conditional.

## DAC and CRS code rules

- Distinguish a three-digit DAC sector category from a five-digit CRS purpose code.
- Treat `sectorCode` on `iati_query_country` as a filter for a code already known. It neither lists
  valid codes nor verifies their meanings. It is an exact filter: `311` does not match `31120`.
- Treat `dac_purpose_code_lookup` as proof that a code and label are valid, not proof that a donor
  reported that code for a particular activity. Label a reasoned selection as recommended or
  likely unless an activity-level official source records the actual assignment.
- Treat an IATI sector as a current publisher-reported IATI value only when it comes from the uniquely
  matched named activity. It is not proof of an OECD CRS database submission. An unrelated country
  search hit is not assignment evidence.
- IATI permits sector reporting either at activity level or for every transaction. A missing
  `transaction_sector_code` on an activity response is not activity-sector evidence, while an empty
  `activity_sectors` array requires a transaction-level check before any absence conclusion.
- Treat `activity_sectors_truncated: true` as an explicitly partial result, not a complete sector
  list.
- Never treat a development-document category, an ODA Map sector label, or a missing IATI
  `sector_code` as the officially reported CRS purpose code.
- When the user provides a label but no code, resolve it with `dac_purpose_code_lookup.query`
  before filtering IATI.
- When the user asks for children of `311`, `312`, or `313`, retrieve the current five-digit entries
  with an exact-code lookup and `includeChildren=true`. Do not reconstruct the list from memory.
- Report the returned codelist ID and version, plus `fetched_at` and stale/cache caveats when
  relevant. Do not turn the fetch timestamp into an OECD publication date.

## Evidence boundaries

- Use `country_data_status` before interpreting country context. `stale`, `no_data`, `disabled`, or
  `error` is not zero.
- Keep OECD DAC2A, OECD CRS, and IATI results separately labelled. They have different units,
  coverage, and counting rules.
- Never present an IATI search count as a unique project count or as an OECD disbursement total.
- Use `oda_map_data_status` and the `korean-oda-portfolio-lookup` Skill for Korean or KOICA project
  inventories.
- Use the `koica-regulation-research` Skill only when the user asks for an internal KOICA rule or
  procedure governing how a classification is applied.
- Use `generate-development-country-report` for a full written country report.

## Answer format

Lead with the requested value, list, or finding. Then identify the dataset and source, the country
and period when applicable, the unit or counting rule, and any unavailable field. Say explicitly
which evidence came from the gateway. For DAC/CRS code results, link or name the returned OECD
`public_url` or `api_url`; the gateway is the access path, while OECD is the publisher. For an
IATI-reported assignment, state every vocabulary `1` code and percentage plus the activity record's
`last_updated_datetime`, and label it the **current IATI-reported activity or transaction sector**.
Do not call it the original submission or the OECD CRS submission unless a versioned historical or
official OECD activity record proves that claim.
