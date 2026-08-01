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

## Data sources and attribution

Each gateway tool declares its source domain in its description as
`[Source: ...]`. An answer names the source it rests on and gives that source's
public address, so a reader can open the evidence instead of taking the answer
on trust.

Source status entries carry a `public_url` field. Prefer it over the tables
below: it is what the gateway declares for that source, and it stays correct
when this document falls behind.

| Source domain | Tools | Public address |
|---|---|---|
| `korean-oda-map` | `oda_map_data_status`, `oda_map_country_context`, `oda_map_projects`, `oda_map_project_detail` | https://oda-map-lab.pages.dev |
| `international-data` | `country_data_status`, `country_report_context`, `country_list`, `country_map_outline`, `country_hazard_snapshot`, `country_humanitarian_context`, `country_travel_alert`, `iati_query_country`, `iati_status`, `iati_test_connection` | Per source key below |
| `koica-regulations` | `search_regulation`, `find_references`, `list_sources`, `verify_citation` | No registered public address |
| `development-documents` | `list_available_corpora`, `search_development_trends` | No registered public address |
| `partner-country-procurement` | `procurement_country_context`, `procurement_model_detail`, `procurement_model_status` | Per-model address in the `model_url` response field |

`country_data_status` reports freshness per source key within
`international-data`. Attribute the key rather than the domain:

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

The KOICA regulation index and the development-document corpus have no
registered public address, and the gateway is their access path. That is the
answer to give when a reader asks where the indexed text can be seen. A public
portal that resembles the source holds something else, and sending a reader
there costs them the check they were trying to make. Procurement is different:
each model response carries its own `model_url`, so quote that field rather than
a domain.

`country_travel_alert` is approved on the contract, but the MOFA travel-alert
service key is not configured on the public deployment, so `mofa_travel_alert`
reports `disabled` and the tool returns no alert level. That is a disabled
source, not an absence of travel risk.

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
