---
name: koica-regulation-research
description: Search, read in full, and verify citations to KOICA internal regulations, implementation rules, guidelines, standards, annexes, and cross-references through the ODA Intelligence public gateway. Use for questions about KOICA personnel, leave, pay, promotion, discipline, organization, accounting, contracts, procurement, audits, welfare, country programs, partnerships, or training rules. Confirm consequential conclusions against the current official source, and do not use this Skill as the sole source for external Korean law.
---

# Research KOICA Regulations

Answer regulation questions from the indexed text, with verifiable regulation and article citations backed by the complete article text.

Read [references/research-protocol.md](references/research-protocol.md) before answering a multi-step or high-impact question.

## Workflow

1. Call `search_regulation` first with the user's natural-language issue. Add `include_attachments: true` when the answer may live in an annex table or form (별표·별지).
2. Narrow with `source` only after identifying likely regulation names.
3. Call `get_article` for the complete text of every article the answer rests on, and `get_attachment` for any annex or form it depends on. Quote thresholds, exceptions, and provisos from the full text, not from a search snippet.
4. Call `find_references` when a parent regulation, implementation rule, or cited article can change the interpretation, and `compliance_radar` when revision lag between a parent regulation and its implementation rules matters.
5. Use `list_sources` to confirm the indexed regulation title, revision label, and available source metadata, and `list_attachments` to locate the right annex label.
6. For a consequential conclusion, confirm currency against the current official source: the index follows official revisions on a sync cadence.
7. Draft the answer with the regulation name, article number, revision label, and important limitations.
8. Call `verify_citation` on the final citation-bearing text before returning it.

## Rules

- Distinguish KOICA internal rules from statutes, presidential decrees, ministry rules, and other external law.
- Do not infer that a rule applies to a person or case when the facts needed for applicability are missing.
- Quote only the minimum text necessary and otherwise summarize faithfully.
- Preserve exceptions, provisos, effective dates, transitional provisions, and referenced annexes.
- Do not treat a search snippet as the complete governing article or annex — fetch the full text with `get_article` or `get_attachment` before relying on it.
- Never invent an article number, regulation title, revision date, threshold, or approval authority.
- If `verify_citation` returns `not_found` or `unknown_source`, correct or remove the citation before answering.

## Output

Lead with the direct answer. Then give the governing provisions, procedure or criteria, exceptions, unresolved facts, and whether the complete article text was read. Cite each material proposition as `규정명 제N조` and identify relevant annexes separately by their labels.

Close with the sources the answer used: the regulation titles and revision labels `list_sources` returns, and whether currency was confirmed against the current official source. The underlying regulation text is openly released on the Korean public data portal as 한국국제협력단_정관 및 내부규정; the gateway index is the compiled, searchable access path to it.
