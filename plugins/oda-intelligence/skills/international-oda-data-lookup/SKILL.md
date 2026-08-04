---
name: international-oda-data-lookup
description: Answer targeted international ODA and development-finance questions using OECD DAC/DAC2A/CRS, IATI, and World Bank evidence. Use for DAC or CRS purpose/sector code meanings and lists, recipient-country ODA totals, donor/sector/channel/activity detail, and IATI activity discovery or filtering. Do not use for Korean agency project inventories, KOICA internal regulations, or a full country-report deliverable.
---

# Look Up International ODA Data

Route the question by evidence type before calling a tool. A DAC classification question is not a
KOICA regulation question, and an IATI activity search is not an OECD flow statistic.

## Route the request

1. **DAC/CRS code meaning or code list** — call `dac_purpose_code_lookup`. Use `code` for an exact
   three- or five-digit code, or `query` for an official-English-label search, but never both in
   one call. For a three-digit branch, set `includeChildren=true`. The tool reads the official OECD
   SDMX `CL_DAC_SECTOR` codelist. Never call `search_regulation` for this task.
2. **Comparable recipient-country ODA total** — resolve the ISO2 country code, call
   `country_data_status`, then call `country_report_context`. Label the OECD observations as DAC2A,
   not CRS.
3. **IATI activity, transaction, or budget discovery** — call `iati_status`, then
   `iati_query_country`. Pass the recipient ISO2 code and request only the fields needed.
4. **OECD CRS donor, sector, channel, or activity detail** — use the current official OECD Data
   Explorer or OECD API through an available web or browser tool. The gateway has no dedicated CRS
   detail query. Do not substitute an IATI count for an OECD CRS statistic.

If `dac_purpose_code_lookup` is absent from the current tool snapshot, explain that the gateway
upgrade is not active in this conversation and use the official OECD API through an available web
or browser tool. If the user explicitly requires gateway-only evidence for route 4, state the
unsupported operation directly. Do not search an unrelated gateway source, invent a result, or
imply that an empty response proves the code or flow does not exist.

## DAC and CRS code rules

- Distinguish a three-digit DAC sector category from a five-digit CRS purpose code.
- Treat `sectorCode` on `iati_query_country` as a filter for a code already known. It neither lists
  valid codes nor verifies their meanings.
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
`public_url` or `api_url`; the gateway is the access path, while OECD is the publisher.
