# Security policy

## Reporting

Do not open a public issue containing credentials, personal data, confidential
documents, exploit details, or private repository information. Use GitHub
private vulnerability reporting when available, or contact the repository
owner privately through the address on their GitHub profile.

## Repository boundary

This repository must not contain:

- source-server implementations or private Git history;
- API keys, passwords, bearer tokens, deployment credentials, or `.env` files;
- local paths, credential stores, production logs, or exported user data;
- private repository names or commit identifiers in automated public PR text.

The plugin configuration must continue to use one credential-free, read-only
MCP gateway. Report an unexpected write-capable tool or authentication request
as a security issue.
