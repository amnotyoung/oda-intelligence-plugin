# Portfolio lookup protocol

## Source boundary

| Question | Source | Tool |
|---|---|---|
| What Korean agencies fund and implement in a country | ODA Map | `oda_map_data_status`, `oda_map_country_context`, `oda_map_projects`, `oda_map_project_detail` |
| Project facts needed before classifying a named Korean activity | ODA Map, then the OECD codelist | `oda_map_data_status`, `oda_map_projects`, `oda_map_project_detail`, then `dac_purpose_code_lookup` |
| Comparable country-level ODA totals across donors | OECD DAC2A behind international data | `country_report_context` |
| Multi-donor activity discovery | IATI | public IATI publisher XML |
| Responsible KOICA office and jurisdiction role | Country registry | `country_list` |
| KOICA internal rules governing a procedure | Regulation index | `koica-regulation-research` Skill |

Use the ODA Map for Korean project inventory.

For a CRS question about one named Korean project, preserve that same source order. Read the
project's `description` and detail before looking up candidate codes. The map's sector label can
describe the source category but cannot prove an officially reported five-digit CRS assignment.
Use the OECD codelist to verify meanings, and label the result as a recommendation unless an activity-level official source records the assignment.

For the publisher’s current IATI sector, take the verified map `project_id`, remove only a literal
leading `iati:` and preserve the rest of the identifier. Open the publisher’s public IATI XML
or d-portal activity record. Match the exact identifier, title and recipient. Read each
vocabulary 1 sector code and its reported percentage (vocabulary 1 may be the default).
If the activity has no sector elements, inspect its transactions for sector elements and
vocabularies. Cite the matched record and flag any missing or partial evidence. Use official OECD
activity records for claims about annual CRS submissions.

## Source attribution

A reader who cannot open the source cannot check the answer. Name the source in the chat reply
itself, not only inside a document the reply produces, and give the public address whenever one is
registered below.

Source status entries carry a `public_url` field. Use it when it is present — it is what the
gateway itself declares for that source, and it stays right when this table falls behind. The
tables below are the fallback for responses that do not carry the field, and the answer to a
question about a source you have not called.

Use the domain tag in the tool description when present. For tools such as
`get_health_observation_by_year`, cite the provider and source URL returned with the observation.

| Tool domain | What it holds | Public address |
|---|---|---|
| `korean-oda-map` | An independent, unofficial map of Korean development cooperation locations and its reviewed-correction layer. No agency published it | https://oda-map-lab.pages.dev |
| `international-data` | Country data from World Bank, OECD, hazard and humanitarian sources, with availability reported per source | Per source below |
| `koica-regulations` | Indexed KOICA regulation text | https://github.com/amnotyoung/koica-reg-mcp |

For map responses, read `data.source_status.sources[]`. For international evidence,
`country_data_status` returns `sources[]`, and `country_report_context` returns
`source_status[]`. Cite the `source`, `public_url`, status and date of the entry used.

| Source key | Public address |
|---|---|
| `iati` | https://d-portal.org |
| `oecd` | https://data-explorer.oecd.org |
| `world_bank` | https://data.worldbank.org |
| `world_bank_documents` | https://documents.worldbank.org |
| `unhcr` | https://www.unhcr.org/refugee-statistics/ |
| `who_gho` | https://www.who.int/data/gho |
| `reliefweb` | https://reliefweb.int |
| `hdx_hapi` | https://hapi.humdata.org |
| `usgs` | https://earthquake.usgs.gov |
| `gdacs` | https://www.gdacs.org |
| `eonet` | https://eonet.gsfc.nasa.gov |
| `acled` | https://acleddata.com |
| `mofa_travel_alert` | https://www.0404.go.kr |

Rules:

- Attribute the sources the answer actually rests on. A source that was called and returned nothing
  usable is still worth naming with its status, because that is what the reader needs to judge the
  gap.
- Use the source’s returned URL and observation date. If the URL is missing, use the
  corresponding public address above.
- When the user asks where a source can be seen, answer with the address rather than searching the
  web for a government portal that resembles it.
- Never construct a publisher name either. Call the map `한국 ODA 사업 위치 지도(비공식)` and leave its
  compiler unnamed. It rests on Korean ODA project data, but it is an independent compilation that
  no agency published, and writing an agency name in front of it — `KOICA ...` — turns a private
  project into an official record the reader may go on to cite as one.

## The absence trap

This is the failure this protocol exists to prevent:

1. A user asks what KOICA does in a country.
2. The assistant queries international context and IATI.
3. Neither returns Korean agency projects, because neither carries them.
4. The assistant reports that the gateway holds no KOICA project information.

Step 4 is wrong even when steps 1 to 3 are executed correctly. Korea publishes to IATI only
partially, so an IATI miss measures IATI coverage. The correct move at step 3 is to call
`oda_map_data_status` for the country and route to the ODA Map tools.

Before writing that Korean or KOICA project evidence is unavailable, confirm all three:

- `oda_map_data_status` was called for this country and its `status` is `no_data`, `disabled`, or
  `error`.
- The country name was passed as the source expects — the Korean or English official name — and the
  response did not resolve to a different canonical country.
- The statement names the ODA Map source and its status, rather than claiming the country has no
  Korean projects.

The comparison question carries its own version of the trap. A user asks which projects resemble a
named one; the question sounds like open research, so the assistant searches the web and builds the
answer from whatever press coverage exists. The gateway holds the project records, and press
coverage is a biased sample of them — it favours recent launches and large budgets, and it says
nothing about the projects no one wrote about. Search the countries first, then use the web only for
what the record does not carry.

## Status semantics

| Status | Meaning | Answer treatment |
|---|---|---|
| `fresh` | Within the freshness window | Use with the observation time |
| `stale` | Valid but older than the window | Use with the observation date and the limitation stated |
| `no_data` | Query succeeded, evidence absent | `판단 불충분`; never zero |
| `disabled` | Source not configured | `판단 불충분`; say the source is unavailable |
| `error` | Retrieval failed | `판단 불충분` unless a dated fallback with clear provenance exists |

`PUBLIC_RESPONSE_BLOCKED` is not a row in that table. It says the gateway withheld one response and
says nothing about whether the evidence exists — the source status for the same country is often
`fresh`. Narrow the request before recording anything as `판단 불충분`: fewer sections, a smaller
sample, or a different tool covering the same field. Record only the fields still missing after
that, and tell the reader it is a gateway limitation rather than a data gap.

For the `korean-oda-map` source, `observed_at` is the earliest known reference date among the
underlying sources. The map’s build timestamp is `generated_at` when available. Use `as_of`
for the date used to calculate project status. Read each layer’s own dates and caveats.

## Selecting fields

`fields` on `oda_map_projects` works in both directions, and its default is much narrower than the
schema. Omitting it returns seven fields:

```
id  name  agency  sector  dates  status  location_summary
```

Seven of the fourteen the schema allows are therefore absent by default — `description`, `amounts`,
`locations`, `stage`, `aid_type`, `markers`, and `source`.

- `id` and `name` arrive whether or not you list them. Every item has to carry both, so the
  gateway fills them into any `fields` array before the call leaves. The response echoes the
  applied set, which is why it can come back longer than what you asked for.
- `description` carries the project's outputs and expected results — what gets built, what equipment
  is installed, who gets trained. That is what a question about project content is asking for, and
  what makes two projects comparable or not. The field is populated; the default call drops it
  without saying so. Request it by name whenever the answer describes what a project does.
- Request `amounts` for `budget`, `spent` and `currency`. If
  `values_consistent_across_locations` is false, flag the conflicting records.
- Check the echoed `fields` to distinguish an unrequested field from a requested value
  that is missing. A null budget or expenditure is unknown.
- Request `locations` with `include_coordinates` only when the answer needs geography, and carry the
  `coordinate_provenance` and `coordinate_scope` caveats with any location claim.

## Filtering and paging

- `oda_map_data_status` accepts an empty input for map-wide status. Supply `country` for a
  country assessment. Both `oda_map_country_context` and `oda_map_projects` require one
  country per call. Name the countries searched in a comparison.
- `agency` matches the agency label the source returns, such as `한국국제협력단(KOICA)`. Confirm the
  label from the `agencies` section of `oda_map_country_context` before filtering, and prefer the
  `koica_project_count` field over a hand-rolled count. The labels are not normalised: one country
  carries `산업통상자원부` and `산업통상부` as separate entries, so filtering on one variant silently
  drops the other. The same holds for Korean and English sector labels.
- `status` accepts `active`, `ended`, `planned`, and `unknown`. Requesting one status narrows the
  answer; it does not make the others zero.
- `layers` selects map layers and is a different axis from recomputed status. Do not present a layer
  count as a status count.
- The public profile caps `limit` on `oda_map_projects` and `sample_limit` on
  `oda_map_country_context` at different values; read each tool's schema rather than assuming one
  cap. When `has_more` is true, either page through with `offset` or say explicitly that the list is
  a sample of a stated total.

## What not to infer

- Give a reported amount in the currency supplied for that amount. Label portfolio budget totals with the number of projects covered and the number with unknown or conflicting budgets.
- Do not read the amount embedded in a project name as its budget. `('25-'29/880만불)` is part of
  the name string and can disagree with `amounts` on the same record.
- Do not infer that an `active` project has an approved current-year budget, a solicitation, or a
  contract.
- Do not infer sector priority from a sector count alone; the counts include activities of very
  different size and duration.
- Do not infer an entry opportunity, an open procurement, or a partner relationship from the
  presence of a project.
- Do not merge ODA Map project counts with IATI activity counts into one number.
