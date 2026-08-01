# ODA Intelligence Plugin

[English](README.md) | [한국어](README.ko.md)

Public Claude, Codex, and ChatGPT packaging for evidence-based development
cooperation research.

The plugin installs three Skills and connects exactly one public, read-only MCP
gateway:

```text
https://oda-mcp.fly.dev/oda-intelligence/v2/mcp
```

The gateway provides controlled tools for international aid and country
context, Korean ODA projects, development-cooperation documents, and KOICA
regulation research. Users do not provide an OAuth token or IATI credential.

The four data domains are not installed as four separate Claude connectors.
Claude should show one `oda-intelligence` connector whose 23 read-only tools
route to the `io-mcp`, `oda-map-lab`, `devcoop-kg`, and `koica-reg` backends.
Any separately configured `devcoop-trends` or `koica-reg-mcp` connectors are
legacy/direct connections and are independent of this plugin.

This repository contains no source-server implementation, deployment secret,
private Git history, or local credential store. Its only runtime dependency is
the public MCP contract.

## Claude

Add `amnotyoung/oda-intelligence-plugin` as a personal plugin marketplace, then
install `ODA Intelligence`.

After a marketplace sync or plugin update, start a new Claude conversation.
Existing conversations can retain the tool snapshot they had when they were
created. In the plugin details, the expected installed components are:

- three Skills;
- one connector named `oda-intelligence`;
- 23 read-only tools supplied by that connector.

If only the three Skills appear, sync the marketplace, update or reinstall the
plugin, and create another new conversation. The Skills do not call a hidden
backend on their own; they require the bundled connector.

Claude Code:

```bash
claude plugin marketplace add amnotyoung/oda-intelligence-plugin
claude plugin install oda-intelligence@oda-intelligence-plugin
```

## Codex

Install from the public marketplace:

```bash
codex plugin marketplace add amnotyoung/oda-intelligence-plugin
codex plugin add oda-intelligence@oda-intelligence-plugin
```

For local development, replace the repository argument with `.`.

Start a new task after installation or update so Codex loads the new Skills and
MCP configuration.

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

## Controlled updates

- Data and compatible server behavior change at the remote services without a
  plugin update.
- The versioned `v1` endpoint fixes the approved tool surface. Tool names,
  required inputs, required outputs, read-only guarantees, and forbidden
  high-exposure tools are checked against `contracts/gateway-contract.json`.
- A daily workflow records compatible metadata drift for review.
- Breaking contract drift fails instead of rewriting the accepted contract.
- Skill routing and accepted contract changes require a versioned plugin
  update.

## Public content boundary

- KOICA regulation tools expose bounded search snippets, source metadata,
  cross-references, and citation verification. Complete articles, attachments,
  annex files, and bulk text are not exposed by the public profile.
- Development-document tools expose corpus discovery, bounded summaries, and
  public original URLs. Complete indexed documents and extracted relationship
  graphs are not exposed by the public profile.
- IATI and other international-source credentials are managed by the server
  and are never included in the plugin or returned to users.
- Korean ODA Map tools can return the effective final coordinates already
  shown on the public map. Coordinate provenance and scope must be retained;
  pre-correction coordinates, review history, and submitter data are excluded.

## Data sources and attribution

Every tool routes to a public upstream source. This repository does not
relicense returned data; attribution, licensing, and reuse conditions stay with
the source named below.

`country_data_status`, `country_hazard_snapshot`, `country_humanitarian_context`,
and `country_report_context` aggregate the international sources marked ★.

| Public source | Address | Tools |
| --- | --- | --- |
| IATI Standard | `https://iatistandard.org` | ★, `iati_query_country`, `iati_status`, `iati_test_connection` |
| World Bank Open Data | `https://data.worldbank.org` | ★ |
| World Bank Documents & Reports | `https://documents.worldbank.org` | ★ |
| OECD Data Explorer (DAC) | `https://data-explorer.oecd.org` | ★ |
| USGS Earthquake Hazards Program | `https://earthquake.usgs.gov` | ★ |
| GDACS | `https://www.gdacs.org` | ★ |
| NASA EONET | `https://eonet.gsfc.nasa.gov` | ★ |
| UNHCR Refugee Data Finder | `https://www.unhcr.org/refugee-statistics` | ★ |
| WHO Global Health Observatory | `https://www.who.int/data/gho` | ★ |
| HDX HAPI | `https://data.humdata.org` | ★ |
| ReliefWeb | `https://reliefweb.int` | ★ |
| ACLED | `https://acleddata.com` | ★ |
| MOFA overseas travel safety — travel alert levels for Korean nationals | `https://www.0404.go.kr` | `country_travel_alert` |
| `datasets/geo-countries` public country GeoJSON | `https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson` | `country_map_outline` |
| KOICA regulations, implementing rules, and guidelines | `https://www.koica.go.kr` | `find_references`, `list_sources`, `search_regulation`, `verify_citation` |
| KOICA overseas office registry and the development-document corpus; each result carries its own public original URL | `https://www.koica.go.kr` | `country_list`, `list_available_corpora`, `search_development_trends` |
| ODA Korea portal — Korean ODA project and map records | `https://www.odakorea.go.kr` | `oda_map_country_context`, `oda_map_data_status`, `oda_map_project_detail`, `oda_map_projects` |
| Partner-country procurement models, normalized from official law and institutional sources | per-model public address in the `model_url` response field | `procurement_country_context`, `procurement_model_detail`, `procurement_model_status` |

Source availability is reported per call, and a disabled, stale, or failed
source is never returned as "no alert" or "no risk". `country_travel_alert` is
approved on the public contract but currently returns
`alert_signal: "unavailable"` for every country, because the MOFA travel alert
service key is not configured on the deployed gateway.

## Data-use notice

The plugin routes requests to external data services. Source availability,
licensing, confidentiality, and reuse conditions remain governed by the
relevant source and operator. Do not treat a public MCP endpoint as proof that
every returned document is cleared for unrestricted redistribution.

## Development

```bash
npm ci
npm test
npm run contracts:check
```

Source code is licensed under the [Apache License 2.0](LICENSE). Data returned
by MCP tools is not relicensed by this repository. See the
[privacy notice](PRIVACY.md) and [terms of use](TERMS.md).
