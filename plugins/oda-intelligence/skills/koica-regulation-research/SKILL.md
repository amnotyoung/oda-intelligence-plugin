---
name: koica-regulation-research
description: Search and verify citations to KOICA internal regulations, implementation rules, guidelines, standards, and cross-references through the bounded ODA Intelligence public gateway. Use for questions about KOICA personnel, leave, pay, promotion, discipline, organization, accounting, contracts, procurement, audits, welfare, country programs, partnerships, or training rules. Confirm consequential conclusions against the current official source, and do not use this Skill as the sole source for external Korean law.
---

# Research KOICA Regulations

Answer regulation questions from the indexed text, with verifiable regulation and article citations.

Read [references/research-protocol.md](references/research-protocol.md) before answering a multi-step or high-impact question.

## Workflow

1. Call `search_regulation` first with the user's natural-language issue.
2. Narrow with `source` only after identifying likely regulation names.
3. Call `find_references` when a parent regulation, implementation rule, or cited article can change the interpretation.
4. Use `list_sources` to confirm the indexed regulation title and available source metadata.
5. Open the current official source outside the gateway before giving a consequential conclusion that depends on complete article text, an annex, a form, a threshold, an exception, or transitional provisions.
6. Draft the answer with the regulation name, article number, source status, and important limitations.
7. Call `verify_citation` on the final citation-bearing text before returning it.

## Rules

- Distinguish KOICA internal rules from statutes, presidential decrees, ministry rules, and other external law.
- Do not infer that a rule applies to a person or case when the facts needed for applicability are missing.
- Quote only the minimum text necessary and otherwise summarize faithfully.
- Preserve exceptions, provisos, effective dates, transitional provisions, and referenced annexes.
- Do not claim that a bounded search result is the complete governing article or annex.
- Never invent an article number, regulation title, revision date, threshold, or approval authority.
- If `verify_citation` returns `not_found` or `unknown_source`, correct or remove the citation before answering.

## Output

Lead with the direct answer. Then give the governing provisions, procedure or criteria, exceptions, unresolved facts, and whether the complete official text was confirmed. Cite each material proposition as `규정명 제N조` and identify relevant annexes separately.

Close with the sources the answer used: the regulation titles and revision labels `list_sources` returns, and whether the complete official text was confirmed outside the gateway. The regulation index has no registered public address — the gateway is its access path — so say that rather than offering a public portal URL that resembles it.
