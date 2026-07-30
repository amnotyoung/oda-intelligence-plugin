---
name: generate-development-country-report
description: Generate or revise evidence-based development cooperation and ODA country reports using the versioned ODA Intelligence gateway. Use for country profiles, aid-landscape reviews, Korean ODA portfolio analysis, priority-sector analysis, participation routes, risk conditions, and source-grounded Markdown or Word report preparation. Never convert unavailable evidence into zero or no risk.
---

# Generate a Development Country Report

Build a decision-useful report while keeping tool traces, credentials, internal identifiers, and raw collection artifacts out of reader-facing prose.

## Required references

Read these files before drafting:

- [references/source-routing.md](references/source-routing.md) for MCP selection and call order.
- [references/report-standard.md](references/report-standard.md) for the report structure.
- [references/citation-policy.md](references/citation-policy.md) for evidence and citation rules.

Start new reports from [assets/country-report-template.md](assets/country-report-template.md).

## Workflow

1. Resolve the country, ISO codes, reference date, language, audience, and requested output format.
2. Call status tools before interpreting evidence. Record each source as fresh, stale, no data, disabled, or error.
3. Make a separate evidence-sufficiency decision for the country profile, development environment, international aid, Korean portfolio, participation routes, and risks.
4. Collect only the evidence needed for those sections, following the routing reference.
5. Separate observations from interpretation and recommendations.
6. Cross-check material claims across independent sources when possible.
7. Draft using the report standard and citation policy.
8. Validate every number, date, project count, regulation citation, and recommendation against its supporting evidence.
9. If Word output is requested, use the available document skill and complete its render-and-inspect workflow.

## Non-negotiable rules

- Treat `no_data`, `disabled`, and `error` as insufficient evidence, never as zero, no need, or no risk.
- Do not present an IATI search-result count as a unique project count.
- Deduplicate map records by stable activity identifier; distinguish map entities from unique projects.
- Do not aggregate budgets with missing or conflicting currencies.
- Use KOICA regulation tools only for KOICA internal rules; research external law separately.
- Verify every final KOICA regulation citation with `verify_citation`.
- Cite exact document titles and public original URLs when the server returns them.
- Keep MCP corpus IDs, internal document IDs, raw queries, credentials, local paths, and cache details out of the reader-facing report.
- State observation years and reference dates beside quantitative claims.
- Use `판단 불충분` or an equivalent phrase when evidence cannot support a judgement.

## Failure handling

Continue with available sources when one gateway source or data domain is unavailable. Identify the affected claims or sections and narrow the conclusion. Do not silently substitute a different dataset or observation period.
