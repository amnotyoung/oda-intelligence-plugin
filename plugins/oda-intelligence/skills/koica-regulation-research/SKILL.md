---
name: koica-regulation-research
description: Search the public gateway for KOICA regulations, annexes and cross-references, verify article citations, and read the governing text in the official publication. Use for questions about KOICA personnel, leave, pay, promotion, discipline, organization, accounting, contracts, procurement, audits, welfare, country programs, partnerships, or training rules. Confirm consequential conclusions against the current official source. Do not use for OECD DAC/CRS purpose codes, external classifications, aid statistics, or external Korean law.
---

# Research KOICA Regulations

Use the gateway to locate the provision and check the citation. Base the interpretation on the full text published by KOICA or ALIO.

Read [references/research-protocol.md](references/research-protocol.md) before answering a multi-step or high-impact question.

## Workflow

1. Call `search_regulation` first with the user's natural-language issue. Add `include_attachments: true` when the answer may live in an annex table or form (별표·별지). If it returns `PUBLIC_RESPONSE_BLOCKED`, do not stop — follow *When a call is blocked* below and continue from step 3.
2. Narrow with `source` only after identifying likely regulation names.
3. Follow [KOICA’s regulation guide](https://www.koica.go.kr/koica_kr/8085/subview.do) to the ALIO filing and open the complete article and any governing attachment. Confirm effective dates, exceptions and thresholds against that text.
4. Call `find_references` when a parent regulation, implementation rule, or cited article can change the interpretation, and `compliance_radar` when revision lag between a parent regulation and its implementation rules matters.
5. Use `list_sources` to confirm the indexed regulation title, revision label, and available source metadata, and `list_attachments` to locate the right annex label.
6. For a consequential conclusion, confirm currency against the current official source: the index follows official revisions on a sync cadence.
7. Draft the answer with the regulation name, article number, revision label, and important limitations.
8. Pass each final citation, including any quoted article title, to `verify_citation`. Keep each input within 500 characters and check that every citation has a result.

## Rules

- Distinguish KOICA internal rules from statutes, presidential decrees, ministry rules, and other external law.
- Treat OECD DAC/CRS purpose codes, sector classifications, and statistical code lists as external
  classifications. Never call `search_regulation` merely because the question mentions KOICA or
  asks how an ODA activity is classified. Use `international-oda-data-lookup` unless the user asks
  for the internal KOICA rule governing how staff apply that classification.
- Do not infer that a rule applies to a person or case when the facts needed for applicability are missing.
- Quote only the minimum text necessary and otherwise summarize faithfully.
- Preserve exceptions, provisos, effective dates, transitional provisions, and referenced annexes.
- Do not treat a search snippet as the complete governing article or annex — fetch the full text in the official KOICA or ALIO publication before relying on it.
- Never invent an article number, regulation title, revision date, threshold, or approval authority.
- For `content_mismatch`, compare the cited title with the official article, correct the citation and verify it again. For `not_found` or `unknown_source`, check the article number and regulation name. Remove an unsupported citation.
- An `ok` result confirms the article number in the index. Treat the title as verified by the gateway only when `title_verified` is true. Use the published text to support any substantive claim.

## When a call is blocked

`PUBLIC_RESPONSE_BLOCKED` means the gateway withheld one response. It is not a finding that the regulation, article, or annex is missing, and it does not mean the index is unreachable — the sibling tools on the same source usually still answer.

Use the index to identify the likely publication, then open the official text:

1. `list_sources` gives every indexed regulation title, category, revision label, and article count. Narrow to the governing regulation by subject: procurement and contract questions to 「대외무상협력사업에 관한 조달 및 계약규정」 and its 시행세칙, personnel questions to 「인사규정」 and its 시행세칙.
2. Open the officially published regulation for the governing article. If unavailable, identify the missing text and leave its interpretation open.
3. `find_references` expands from any article already located to the articles citing it or cited by it — often the fastest route to the procedure, approval authority, or sanction attached to a substantive rule.
4. `list_attachments` locates annexes and forms by label, and the official publication supplies their text.

State which search or publication was unavailable and which provisions you verified. If the official text could not be read, leave conclusions that depend on it open.

## Output

Lead with the direct answer. Then give the governing provisions, procedure or criteria, exceptions, unresolved facts, and whether the complete article text was read. Cite each material proposition as `규정명 제N조` and identify relevant annexes separately by their labels.

Close with the sources the answer used: the regulation titles and revision labels `list_sources` returns, and whether currency was confirmed against the current official source. The underlying regulation text is openly released on the Korean public data portal as 한국국제협력단_정관 및 내부규정; the gateway index is the compiled, searchable access path to it.
