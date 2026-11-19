# ODA Intelligence Plugin

[한국어](README.md) | [English](README.en.md)

**ODA Intelligence** lets you look up Korean ODA project locations, OECD development finance, WHO and World Bank indicators, hazard and humanitarian data, and KOICA regulations. Public version 0.2.37 includes 22 read-only tools and three research skills. The gateway requires no personal API key. It installs in Claude, Codex, Antigravity, and ChatGPT.

Class participants install this same plugin. Choose the instructions for your app, then run the Timor-Leste example to check the connection.

[Claude installation](#claude) · [Codex installation](#codex) · [ChatGPT availability](#chatgpt) · [Timor-Leste example](#check-your-installation)

If your app takes a remote MCP URL directly, name the server `oda-intelligence` and enter the address below. If you previously registered the classroom-only URL manually, replace it with this one.

```text
https://oda-mcp.fly.dev/oda-intelligence/v2/mcp
```

## Claude

Add `amnotyoung/oda-intelligence-plugin` as a personal plugin marketplace, then
install `ODA Intelligence`.

After a marketplace sync or plugin update, start a new Claude conversation.
Existing conversations can retain the tool snapshot they had when they were
created. In the plugin details, the expected installed components are:

- three Skills;
- one connector named `oda-intelligence`;
- the read-only tools supplied by that connector.

If only the three Skills appear, sync the marketplace, update or reinstall the
plugin, and create another new conversation. The Skills do not call a hidden
backend on their own; they require the bundled connector.

Claude Code:

```bash
claude plugin marketplace add amnotyoung/oda-intelligence-plugin
claude plugin install oda-intelligence@oda-intelligence-plugin
```

This desktop installation demo shows an earlier version. The current version installs three Skills.

![ODA Intelligence install demo](docs/assets/install-demo.gif)

## Codex

Add the public GitHub repository as a Codex marketplace source, then install
the plugin:

```bash
codex plugin marketplace add amnotyoung/oda-intelligence-plugin
codex plugin add oda-intelligence@oda-intelligence-plugin
```

After installing, open a new task and try the [Timor-Leste exercise](#check-your-installation). The plugin registers the public `oda-intelligence` MCP server for you.

For local development, run the commands from the repository root and replace
the repository argument with `.`:

```bash
codex plugin marketplace add .
codex plugin add oda-intelligence@oda-intelligence-plugin
```

To update an installation from GitHub, refresh the marketplace and reinstall
the plugin:

```bash
codex plugin marketplace upgrade oda-intelligence-plugin
codex plugin add oda-intelligence@oda-intelligence-plugin
```

After changing the local source, update the plugin version or Codex cachebuster
and run `codex plugin add` again. Start a new task after installation or
reinstallation so Codex loads the updated Skills and MCP configuration.

## Antigravity

In Google Antigravity, install straight from the GitHub repository with the
`agy` CLI (1.3.3 or later):

```bash
agy plugin install https://github.com/amnotyoung/oda-intelligence-plugin
```

`agy` finds `oda-intelligence` in the repository's `plugins/` folder and
installs it from the Antigravity manifest (`.antigravity-plugin/plugin.json`)
and MCP configuration (`mcp_config.json`). The three Skills come from the same
`skills/` folder as the Claude and Codex packages. The gateway is connected
through `serverUrl`, Antigravity's remote MCP field, and the agent sees it as
the `oda-intelligence_oda-intelligence` server.

Check the installation with:

```bash
agy plugin list
```

It should show `oda-intelligence (enabled, …)`, `Source: antigravity`, and
`3 skills, 1 MCP server`. Allow the MCP permission prompt on the first tool
call. To update, run the same `agy plugin install` command again and start a
new conversation.

From a local copy, point at the plugin folder from the repository root:

```bash
agy plugin install ./plugins/oda-intelligence
```

To connect only the tools without the CLI, add this entry under `mcpServers`
in Antigravity's MCP configuration (`mcp_config.json`). This does not install
the Skills. Put the remote address in `serverUrl`; `httpUrl` is not supported.

```json
{
  "mcpServers": {
    "oda-intelligence": {
      "serverUrl": "https://oda-mcp.fly.dev/oda-intelligence/v2/mcp"
    }
  }
}
```

## ChatGPT

The complete plugin combines the three bundled Skills with the registered
`ODA Intelligence` MCP app. The committed `.app.json` contains the app's
technical identifier, not a credential or authentication token.

For maintainer testing, enable ChatGPT developer mode, add this repository as a
personal marketplace source, and install `ODA Intelligence`. The registered app
uses the gateway URL above with no authentication.

This developer-mode package is not yet a public directory release. Universal
ChatGPT distribution requires a **With MCP** directory submission of the same
gateway; a Skills-only submission would intentionally omit the app mapping.

ChatGPT keeps an approved snapshot of tool definitions. Compatible data and
server behavior changes are available at the same URL, while a new tool-contract
version must be reviewed and refreshed by a workspace administrator.

## Check your installation

After installation, open a new conversation and ask:

> Use ODA Intelligence to look up the neonatal mortality rate in Timor-Leste in 2019.

1. Open the `get_health_observation_by_year` call in the activity history. The inputs are country `TLS`, indicator `WB:SH.DYN.NMRT`, and year `2019`.
2. Open the returned `api_url` and compare the World Bank row’s `date` and `value`. On 19 November 2026, the API returned **23.5 deaths per 1,000 live births**. [World Bank response](https://api.worldbank.org/v2/country/TLS/indicator/SH.DYN.NMRT?date=2019&format=json)
3. Record both the observation year (`year`) and the retrieval time (`fetched_at`). A later release can revise the estimate for 2019.

If you cannot see the call, check the `oda-intelligence` connection in your app and try again in a new conversation.

## Public catalog of 22 tools

For maternal, neonatal or under-five mortality in a given year, request the country, indicator and year. Check the source URL, retrieval time, unit and original row. Use regulation discovery and citation checks with the official publication for full text. Country summaries mark IATI Datastore, Korean Ministry of Foreign Affairs travel advisories, HDX HAPI and ReliefWeb as `disabled`. This means the source was not queried.

- **Development and health indicators** · `country_indicator_data_status`, `get_country_indicator_snapshot`, `search_development_indicator_catalog`, `get_health_observation_by_year`
- **Korean project map** · `oda_map_country_context`, `oda_map_data_status`, `oda_map_project_detail`, `oda_map_projects`
- **OECD development finance** · `dac_purpose_code_lookup`, `oecd_crs_query_country`
- **Country, hazard and humanitarian context** · `country_data_status`, `country_hazard_snapshot`, `country_humanitarian_context`, `country_list`, `country_map_outline`, `country_report_context`
- **KOICA regulations** · `compliance_radar`, `find_references`, `list_attachments`, `list_sources`, `search_regulation`, `verify_citation`

### Korean ODA projects — `korean-oda-map`

Korean development cooperation projects and their locations. Start with the
status tool; it reports the source and correction layers separately.

| Tool | What it returns | Inputs |
|---|---|---|
| `oda_map_data_status` | Layer state (`fresh`, `stale`, `no_data`, `disabled`, `error`), cache time, record count, coverage | `country` |
| `oda_map_country_context` | Report-ready country summary: portfolio, agencies, sectors, map layers, locations. Separates map pins from unique projects and recalculates status against `as_of`. Carries no hazard, security, or travel data | **`country`**, `as_of`, `sections`, `sample_limit`, `include_coordinates` |
| `oda_map_projects` | Search, filter, and page a country's projects. A multi-location project is counted once by activity identifier, with its sites kept in `locations` | **`country`**, `query`, `agency`, `sector`, `status`, `layers`, `as_of`, `limit`, `offset`, `fields`, `include_coordinates` |
| `oda_map_project_detail` | One project by identifier, or by a location-suffixed map entity ID. Reports multi-location spread, budget duplication, source-layer state, and as-of status separately | **`project_id`**, `country`, `as_of`, `include_coordinates` |

> Summarise the health projects Korean agencies run in Myanmar, and name the
> source the list came from.

```text
oda_map_data_status    { "country": "미얀마" }
oda_map_projects       { "country": "미얀마", "sector": "보건", "limit": 3 }
oda_map_project_detail { "project_id": "iati:KR-GOV-110-201917011048" }
```

`status` accepts `active`, `ended`, `planned`, or `unknown`, and it is derived
from `as_of` rather than stored, so a portfolio count is only meaningful next
to the date it was computed for.

### International context — `international-data`

| Tool | What it returns | Inputs |
|---|---|---|
| `dac_purpose_code_lookup` | Official OECD SDMX `CL_DAC_SECTOR` entries: 3-digit DAC sectors, 5-digit CRS purpose codes, parent relationships, and codelist version | `code`, `query`, `includeChildren`, `limit`, `refresh` |
| `oecd_crs_query_country` | OECD CRS records reported by Korea for a recipient and year | **`countryCode`**, **`year`**, `sectorCode`, `flowType`, `breakdown`, `limit`, `refresh` |
| `get_health_observation_by_year` | WHO maternal mortality or World Bank neonatal or under-five mortality for a specified year, with source row, unit, URL and retrieval time | **`country`** (ISO3), **`indicator`**, **`year`** |
| `country_data_status` | Observation, collection, and cache dates, record counts, errors, and freshness for World Bank, OECD, hazard, UNHCR and WHO sources; includes status for disabled feeds | **`countryCode`**, `refresh` |
| `country_indicator_data_status` | Country indicator availability and provider status | **`countryCode`** (ISO3) |
| `search_development_indicator_catalog` | Search definitions, units and stable IDs across 42 World Bank indicators and one WHO GHO indicator | `query`, `source`, `limit` |
| `get_country_indicator_snapshot` | Country observations, reference years, units, sources and missing-data status for selected indicators | **`countryCode`** (ISO3), **`indicatorIds`** (up to 20) |
| `country_report_context` | Report-ready context in one call: source status, counts, and three samples per source | **`countryCode`**, `sampleSize`, `fields`, `refresh` |
| `country_humanitarian_context` | UNHCR and WHO GHO observations, plus World Bank document metadata | **`countryCode`**, `sampleSize`, `fields`, `refresh` |
| `country_hazard_snapshot` | USGS, GDACS, and NASA EONET events clipped to the country boundary, de-duplicated by same type within 100 km and 48 hours | **`countryCode`**, `sampleSize`, `includeEvents`, `fields`, `refresh` |
| `country_list` | KOICA overseas-office host and concurrent countries with ISO codes, responsible office, and jurisdiction role | (none) |
| `country_map_outline` | Simplified country outline for a report base map. Geographic context for placing project sites, not a boundary determination | **`countryCode`** |

### KOICA regulations — `koica-regulations`

| Tool | What it returns | Inputs |
|---|---|---|
| `search_regulation` | Regulation metadata and article snippets with a relevance score. `include_attachments: true` searches annex tables and forms (별표·별지) too, and `mode` picks hybrid (default), keyword, or semantic retrieval | **`query`**, `category`, `source`, `limit`, `fuzzy`, `include_attachments`, `mode` |
| `list_sources` | The indexed current regulations with category, revision date, and article count | `category` |
| `list_attachments` | The annex/form index (별표·별지) with titles and excerpts, filterable by regulation, category, and kind. Truncates to the response budget; `total` always states the true count | `source`, `category`, `kind`, `include_deleted` |
| `find_references` | Citation graph for one article: what it cites (`outgoing`) and what cites it (`incoming`), each marked `same_regulation`, `cross_regulation`, or `external`. `include_mermaid: true` adds a flowchart of the graph. An article that is not found returns an empty graph, not an error | **`source`**, **`article`**, `limit`, `include_mermaid` |
| `compliance_radar` | Revision-lag radar: flags implementation rules and guidelines whose parent regulation was revised more recently (`review_needed` / `ok` / `unknown` / `no_parent`) | `source` |
| `verify_citation` | Cross-checks every `{regulation} 제N조` citation in a text against the index and marks each `ok`, `not_found`, or `unknown_source` | **`text`** |

## Controlled updates

- Data and compatible server behavior change at the remote services without a
  plugin update.
- The versioned `v2` endpoint fixes the approved tool surface. Tool names,
  required inputs, required outputs, read-only guarantees, and forbidden
  high-exposure tools are checked against `contracts/gateway-contract.json`.
- The daily check and its update PR use the built-in GitHub Actions token. The job checks the live gateway and runs package tests, a dependency audit, and a version check on changes.
- A daily workflow auto-merges generated lock metadata updates only when the
  exact tool contract hashes stay unchanged. Tool schema/detail hash drift is
  left as an open pull request for human review.
- Breaking contract drift fails instead of rewriting the accepted contract.
- Skill routing and accepted contract changes require a versioned plugin
  update; installed caches still need a marketplace upgrade and a new
  conversation.

## Data-use notice

The plugin routes requests to external data services. Source availability,
licensing, confidentiality, and reuse conditions remain governed by the
relevant source and operator. Do not treat a public MCP endpoint as proof that
every returned document is cleared for unrestricted redistribution.

## Related tooling

[DevEval Agents](https://github.com/amnotyoung/dev-eval-agents) — a
multi-agent OECD-DAC evaluation framework by the same maintainer — uses this
gateway as an optional evidence source: country context for relevance and
coherence ratings, the Korean ODA map for duplication checks, and
`verify_citation` for regulation citations in evaluation reports. The
integration is one-way and optional; this plugin does not depend on it, and
its tool surface is unchanged by it.

## Development

```bash
npm ci
npm test
npm run contracts:check
```

Check the Antigravity package with `agy plugin validate plugins/oda-intelligence`.
With `--strict` it fails on one warning because Claude Code's `.mcp.json` sits
in the same folder. Antigravity never reads that file and the Claude package
needs it, so the warning is expected.

Source code is licensed under the [Apache License 2.0](LICENSE). Data returned
by MCP tools is not relicensed by this repository. See the
[privacy notice](PRIVACY.md) and [terms of use](TERMS.md).
