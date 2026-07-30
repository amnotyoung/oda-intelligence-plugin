# ODA Intelligence Plugin

Public Claude, Codex, and ChatGPT packaging for evidence-based development
cooperation research.

The plugin installs two Skills and connects exactly one public, read-only MCP
gateway:

```text
https://oda-mcp.fly.dev/oda-intelligence/v1/mcp
```

The gateway provides controlled tools for international aid and country
context, Korean ODA projects, development-cooperation documents, and KOICA
regulation research. Users do not provide an OAuth token or IATI credential.

This repository contains no source-server implementation, deployment secret,
private Git history, or local credential store. Its only runtime dependency is
the public MCP contract.

## Claude

Add `amnotyoung/oda-intelligence-plugin` as a personal plugin marketplace, then
install `ODA Intelligence`.

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

Create an MCP app named `ODA Intelligence`, use the gateway URL above, select no
authentication, and scan the available tools. ChatGPT installs the remote MCP
app; it does not install the Claude/Codex Skill files in this repository.

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
