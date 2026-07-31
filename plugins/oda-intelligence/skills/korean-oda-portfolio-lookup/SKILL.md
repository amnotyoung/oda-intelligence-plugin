---
name: korean-oda-portfolio-lookup
description: Answer direct questions about what Korean development cooperation agencies are doing in a country — KOICA, EDCF, KOFIH, and Korean ministries — using the ODA Map portfolio tools. Use for "what projects does KOICA run in X", Korean project lists, agency or sector breakdowns, active or completed project counts, and single-project detail. Korean bilateral project inventory lives only in the ODA Map source; never conclude from IATI, OECD, or World Bank evidence that Korean projects are absent. For a full written country report, use generate-development-country-report instead.
---

# Look Up the Korean ODA Portfolio

Answer a direct question about Korean development cooperation projects in a country from the ODA Map
portfolio, with the counting rules the source requires.

Read [references/portfolio-lookup-protocol.md](references/portfolio-lookup-protocol.md) before
reporting counts, budgets, or status.

## When this applies

Use this Skill when the user asks what Korea, KOICA, EDCF, KOFIH, or a Korean ministry is doing in a
country — a project list, an agency or sector breakdown, an active or completed count, a portfolio
overview, or the detail of one project. Use it for a targeted answer; it does not produce a report
document.

Hand off to `generate-development-country-report` when the user wants a written country report,
priority-sector selection, procurement entry analysis, or a DOCX deliverable.

## The routing rule this Skill exists to enforce

Korean bilateral project inventory is carried by the **ODA Map** source and nothing else on this
gateway.

- `country_report_context`, `iati_query_country`, and the OECD and World Bank evidence behind them
  are international-data sources. They carry country-level aid aggregates and multi-donor activity
  discovery, not a Korean agency project inventory.
- Korea is a limited IATI publisher. An empty `iati_query_country` result is a statement about IATI
  coverage, not about Korean activity in the country.
- **Never answer that Korean or KOICA project information is unavailable without first calling
  `oda_map_data_status` for that country.** An absent record in an international source is not
  evidence of an absent project. This is the same rule the gateway applies to missing, disabled,
  stale, and failed evidence.

If `oda_map_data_status` returns `no_data`, `disabled`, or `error`, report `판단 불충분` with the
status and the country queried. Do not substitute an international source and do not write zero.

A blocked response is the twin of the absence trap, and this Skill is more exposed to it than the
report Skill: a single answer has no other section to fall back on. When a call returns
`PUBLIC_RESPONSE_BLOCKED`, the gateway refused one response — it did not report that the country has
no Korean projects, and the source status for the same country is often `fresh`.

1. Retry `oda_map_country_context` section by section. The block usually comes from one section, not
   the tool.
2. Recover a blocked `portfolio` from `oda_map_projects`: the per-status `total` for `active`,
   `planned`, `unknown`, and `ended` reconstructs the status counts, and their sum is the
   unique-project count.
3. Report only the fields still missing after those attempts as `판단 불충분`, and name them.

When the source status is `fresh` and a response stays blocked, say that the gateway withheld it.
A reader told the evidence does not exist stops looking.

## Workflow

1. Resolve the country name. The ODA Map tools accept the Korean or English official name and
   return the canonical name with its aliases; pass the user's wording and read `country.canonical`
   back. Use `country_list` only to identify the responsible KOICA office and its jurisdiction role
   — it carries no portfolio data.
2. Call `oda_map_data_status`. Record `status`, `coverage`, `record_count`, and the per-source
   `observed_at`. Stop here and report `판단 불충분` if the status is not usable.
3. Call `oda_map_country_context` for the shape of the portfolio. Request only the sections the
   question needs: `portfolio`, `agencies`, `sectors`, `map_layers`, `locations`, `samples`,
   `source_status`.
4. Call `oda_map_projects` for the project list. Filter with `agency`, `sector`, `status`, or
   `query`, and page with `limit` and `offset`. State that a returned page is a page when
   `has_more` is true.
5. Call `oda_map_project_detail` only for the projects the answer actually turns on.
6. Add international context from `country_report_context` or `iati_query_country` only when the
   user asked to compare Korea against other donors. Keep the two evidence bases labelled
   separately; do not merge an ODA Map count with an IATI count.

Set `as_of` explicitly when the user asks about a past or future reference date. Otherwise the
source recomputes status at the call date, and the answer should say which date it used.

## Counting rules

- `total` and `distinct_project_count` are unique activity identifiers with the location suffix
  removed. `map_feature_count`, `map_entity_count`, and `mapped_project_entity_count` are map
  pins. Never present a pin count as a project count.
- `koica_project_count` and `other_agency_project_count` partition the portfolio. Use
  `koica_project_count` for a KOICA-specific answer rather than filtering and re-counting by hand.
- Agency and sector labels are not normalised, and a ranked list built from them can be wrong. In
  one country the `agencies` section carries `산업통상자원부` and `산업통상부` as separate entries,
  and the `sectors` section carries `교사훈련` and `Teacher training` as separate entries; merging
  either pair changes its rank. `koica_project_count` protects a KOICA answer only. Before giving a
  ranked agency or sector list, look for variant spellings and Korean/English pairs, and either
  merge them and say you did or state that near-duplicate labels are counted separately.
- Project status is recomputed from start and end dates at `as_of`, independently of the map layer.
  `unknown` means the dates could not support a judgement — not zero and not inactive.
- The map dataset does not encode a budget currency. Do not state
  `budget_total_deduplicated` as a won or dollar figure, and do not convert it. Report it only as an
  uncurrencied source field, or omit it and say the currency is unconfirmed.
- Coordinates are target-area reference points. `national_fallback` and `country_reference_point`
  are not project sites, and a geocoded city centroid is not a site either.

## Output

Lead with the direct answer — the count, the agencies, or the named projects the user asked for.
Then give the breakdown, the reference date, the source status with its observation time, and the
limitations that change interpretation.

- Name the ODA Map source and the reference date beside the first count.
- Give project names as the source gives them, Korean and English where both exist.
- Keep activity identifiers, layer names, and other internal fields out of reader-facing prose
  unless the user asked for a machine-readable list.
- Do not read an existing Korean project as an open opportunity, a partnership, or an endorsement.
