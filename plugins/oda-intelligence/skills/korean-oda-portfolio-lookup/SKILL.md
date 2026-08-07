---
name: korean-oda-portfolio-lookup
description: Answer direct questions about Korean development cooperation in a country or around a named city, province, or district. Use search_development_by_place first for place-led questions about development-document mentions, projects mapped there, or both; use the ODA Map portfolio tools for country inventories, counts, and project detail. Covers KOICA, EDCF, KOFIH, Korean ministries, project lists, agency or sector breakdowns, status counts, single-project detail, what projects do, and comparable projects. Korean bilateral inventory lives only in the ODA Map; never infer absence from IATI, OECD, or World Bank or assemble comparisons from web search when gateway records exist. For DAC/CRS codes or international statistics, use international-oda-data-lookup. For a written country report, use generate-development-country-report.
---

# Look Up the Korean ODA Portfolio

Answer a direct question about Korean development cooperation projects in a country or around a
named place, with the source separation and counting rules the evidence requires.

Read [references/portfolio-lookup-protocol.md](references/portfolio-lookup-protocol.md) before
reporting counts, budgets, or status.

## When this applies

Use this Skill when the user asks what Korea, KOICA, EDCF, KOFIH, or a Korean ministry is doing in a
country — a project list, an agency or sector breakdown, an active or completed count, a portfolio
overview, or the detail of one project. Use it for a targeted answer; it does not produce a report
document.

Use it as well when the question starts from a city, province, state, county, or district and asks
for development-cooperation documents, mapped Korean projects, or both. A place-led question has a
different first call from a country inventory: resolve the place before choosing an office corpus
or treating a map result as a portfolio.

It also covers the comparison question — projects comparable to a named one, a precedent, a
benchmark, prior cases in the same sector. That question sounds like a research task and reads as
something to search the web for, but the inventory it needs is the ODA Map source. Answer it from
the gateway, following `Cross-country comparison` below.

Hand off to `generate-development-country-report` when the user wants a written country report,
priority-sector selection, procurement entry analysis, or a DOCX deliverable.
Hand off to `international-oda-data-lookup` when the user asks for DAC/CRS purpose-code meanings,
international donor or sector statistics, or IATI activity discovery rather than a Korean project
inventory.

## The routing rule this Skill exists to enforce

Korean bilateral project inventory is carried by the **ODA Map** source and nothing else on this
gateway.

`search_development_by_place` is a place-discovery surface, not a second country inventory. It
combines two explicitly separate branches: development documents connected to the resolved place
and projects placed at that location in a dated map snapshot. Use it to start a place-led question,
then use the portfolio tools below for current country-level status, exhaustive counts, and detail.

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

## Place-first workflow

When the user's question begins with a city, province, state, county, or district, call
`search_development_by_place` first. Pass the user's place wording in `place` and carry any stated
topic, sector, document kind, month range, or result limit into the same call.

1. Inspect `resolved_places` before interpreting either result branch. The resolver accepts only
   verified exact aliases; no match is not permission to guess from a partial spelling.
2. When `requires_disambiguation` is true, do not choose a same-named place silently. Use the
   country already supplied by the user or ask which candidate they mean, then retry
   `search_development_by_place` with the same `place` and that candidate's `country`.
3. Keep the branches distinct. `knowledge_graph` contains documents that mention the place or are
   connected to a mapped project name. `map` contains projects placed at the resolved map location.
   A document mention is not proof that an activity occurred there, and a map placement is not a
   statement that the project document mentions the place.
4. For a document the answer turns on, call `get_trend_document` with the returned document's
   `office` and its `article_id` as `document_id`. Cite the title, date, outlet, and public original
   URL rather than the identifier.
5. For a mapped project the answer turns on, call `oda_map_project_detail` with its `project_id`.
   If the question asks for a current status, country total, budget, or exhaustive project list,
   continue with `oda_map_data_status` and the country-level workflow below; the place result is a
   bounded snapshot, not the whole portfolio.
6. Never add `knowledge_graph.total_matches` to `map.total_matches`, and never report either as a
   unique country-project count. State the place, resolved country, filters, and the separate totals
   when the bounded search size matters.

## Country-level workflow

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
   `query`, and page with `limit` and `offset`. Set `fields` to what the question needs: the default
   set omits `description` and `amounts`, so a question about what a project does or what it costs
   comes back empty-handed unless you ask for those fields by name. State that a returned page is a
   page when `has_more` is true.
5. Call `oda_map_project_detail` only for the projects the answer actually turns on.
6. Add international context from `country_report_context` or `iati_query_country` only when the
   user asked to compare Korea against other donors. Keep the two evidence bases labelled
   separately; do not merge an ODA Map count with an IATI count.

Set `as_of` explicitly when the user asks about a past or future reference date. Otherwise the
source recomputes status at the call date, and the answer should say which date it used.

## Cross-country comparison

Every ODA Map call that reads the portfolio — `oda_map_country_context`, `oda_map_projects` —
takes exactly one `country`, and nothing searches the whole portfolio at once. A comparison
question is therefore assembled country by country rather than answered by one query.

1. Read the reference project first — `oda_map_projects` for its country with `description` in
   `fields`, or `oda_map_project_detail` for the single activity. Its sector label and description
   are what make the following queries mean anything. A comparison built from the project title
   alone matches on wording, not on what the projects do.
2. Choose the countries to search, and say why you chose them: the countries the user named, the
   region, the partner countries from `country_list` — or, for a sector-shaped comparison, the
   office ranking from `search_offices_by_topic`. That tool reads the development-documents
   corpus, not the ODA Map inventory, so its hits justify which countries to query and never
   enter the project count. The choice bounds the answer, so it belongs in the answer.
3. Query each country with `query` or `sector`, always with `description` in `fields`. Sector labels
   are not normalised, so a `sector` filter misses projects a `query` term catches, and the reverse.
   Run both when the comparison carries weight.
4. Report the countries searched next to the matches. Eight countries searched is not a statement
   about the partner countries you did not query, and a reader who is not told the boundary will
   read it as one.

Do not assemble the candidate list from a web search. The gateway holds the Korean project records;
a news article about a project is not the record, and a comparison sourced from press coverage
inherits whatever that coverage happened to report. Web evidence can add what the record does not
carry — an implementing partner, a floor area, a groundbreaking date — but label it as a separate
source and keep it out of the count.

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
- Project names frequently embed a period and an amount, as in `('25-'29/880만불)`. That is name
  text the source recorded, not a validated field, and it can disagree with `dates` and `amounts` on
  the same record. Quote it as part of the name where it helps; do not present it as the project's
  budget, do not convert it, and do not reconcile it against `amounts` silently.
- Coordinates are target-area reference points. `national_fallback` and `country_reference_point`
  are not project sites, and a geocoded city centroid is not a site either.

## Output

Lead with the direct answer — the count, the agencies, or the named projects the user asked for.
Then give the breakdown, the reference date, the source status with its observation time, and the
limitations that change interpretation.

- Beside the first count, name the map `한국 ODA 사업 위치 지도(비공식)` with the reference date and the
  public address https://oda-map-lab.pages.dev, so the reader can open the map the count was
  computed from. The map is an independent compilation, not a KOICA publication: never put KOICA or
  any other agency name in front of it, and never give it a product name of your own. It draws on
  Korean ODA project data, but naming an agency as its publisher presents a private compilation as
  an official record.
- Close with the sources the answer used — the tool domain or the `sources[].source` key, its
  status, and its observation time. `references/portfolio-lookup-protocol.md` holds the public
  address for each one. Give the listed address rather than a government portal that merely
  resembles the source.
- Give project names as the source gives them, Korean and English where both exist.
- For a comparison answer, state the countries searched beside the matches, and describe each match
  from its `description` rather than from its title. What makes two projects comparable is what they
  build and train, and the title rarely says.
- For a place answer, name the resolved place and country, distinguish document mentions from mapped
  project locations, and say which documents or projects received a follow-up detail call. Do not
  turn the two branch totals into one count.
- Keep activity identifiers, layer names, and other internal fields out of reader-facing prose
  unless the user asked for a machine-readable list.
- Do not read an existing Korean project as an open opportunity, a partnership, or an endorsement.
