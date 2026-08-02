---
name: koica-regulation-research
description: Search, read in full, and verify citations to KOICA internal regulations, implementation rules, guidelines, standards, annexes, and cross-references through the ODA Intelligence public gateway. Use for questions about KOICA personnel, leave, pay, promotion, discipline, organization, accounting, contracts, procurement, audits, welfare, country programs, partnerships, or training rules. Confirm consequential conclusions against the current official source, and do not use this Skill as the sole source for external Korean law.
---

# Research KOICA Regulations

Answer regulation questions from the indexed text, with verifiable regulation and article citations backed by the complete article text.

Read [references/research-protocol.md](references/research-protocol.md) before answering a multi-step or high-impact question.

## Workflow

1. Call `search_regulation` first with the user's natural-language issue. Add `include_attachments: true` when the answer may live in an annex table or form (별표·별지). If it returns `PUBLIC_RESPONSE_BLOCKED`, do not stop — follow *When a call is blocked* below and continue from step 3.
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

## When a call is blocked

`PUBLIC_RESPONSE_BLOCKED` means the gateway withheld one response. It is not a finding that the regulation, article, or annex is missing, and it does not mean the index is unreachable — the sibling tools on the same source usually still answer.

`search_regulation` is discovery, not the only entrance. When it is blocked, reach the same text through the tools that return it:

1. `list_sources` gives every indexed regulation title, category, revision label, and article count. Narrow to the governing regulation by subject: procurement and contract questions to 「대외무상협력사업에 관한 조달 및 계약규정」 and its 시행세칙, personnel questions to 「인사규정」 and its 시행세칙.
2. `get_article` returns the complete article text by number, and is the authoritative read however the article was found. Walk the article range when the number is unknown; the article count from `list_sources` bounds the walk. Walk one regulation at a time — the gateway rate-limits, and a parent regulation plus its 시행세칙 in one pass can exhaust the budget before `verify_citation` runs.
3. `find_references` expands from any article already located to the articles citing it or cited by it — often the fastest route to the procedure, approval authority, or sanction attached to a substantive rule.
4. `list_attachments` locates annexes and forms by label, and `get_attachment` returns them.

Answer from what those tools return, and state that discovery search was unavailable. Never substitute general public-procurement practice, another institution's rules, or recollection of what a KOICA regulation probably says, and never present such an answer as though the index had been consulted. If the recovery path also fails, say the index could not be read and name what stays unverified.

## Output

Lead with the direct answer. Then give the governing provisions, procedure or criteria, exceptions, unresolved facts, and whether the complete article text was read. Cite each material proposition as `규정명 제N조` and identify relevant annexes separately by their labels.

Close with the sources the answer used: the regulation titles and revision labels `list_sources` returns, and whether currency was confirmed against the current official source. The underlying regulation text is openly released on the Korean public data portal as 한국국제협력단_정관 및 내부규정; the gateway index is the compiled, searchable access path to it.
