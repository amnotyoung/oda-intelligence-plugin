# KOICA regulation research protocol

For consequential personnel, disciplinary, financial, procurement, audit, or program-governance questions:

1. Search broadly by the user's issue, with `include_attachments: true` when an annex table or form may govern. If the search is blocked, switch to the recovery order in *Blocked responses* and keep going.
2. Identify the likely regulation and article, then fetch the complete text in the official KOICA or ALIO publication, and any governing annex or form in its official published attachment.
3. Check provisos, definitions, delegation clauses, effective dates, transitional provisions, and referenced annexes or forms in that full text.
4. Follow cross-regulation references with `find_references` when authority or procedure depends on another rule, and check `compliance_radar` when an implementation rule may lag its parent regulation.
5. Separate the indexed KOICA rule from external statutes or factual applicability.
6. For a consequential conclusion, confirm currency against the current official source: the index follows official revisions on a sync cadence, and the revision label states what the index holds.
7. Verify each final citation with `verify_citation`. Resolve any `content_mismatch` against the published article title and recheck the corrected citation.

Use this answer shape:

- Direct answer
- Governing provisions, quoted from the complete article text
- Procedure, criteria, or approval authority
- Exceptions and referenced annexes
- Facts still needed to determine applicability
- Verified citations

If currency against the current official source was not checked, say so explicitly. If the indexed text is incomplete or contradictory, state that the result requires confirmation from the current official regulation source or responsible KOICA unit.

## Blocked responses

`PUBLIC_RESPONSE_BLOCKED` applies to the individual response. Use the remaining index tools to identify the official publication.

Recover in this order:

1. `list_sources` for the governing regulation's exact title, revision label, and article count. Subject narrows it: procurement, contracting, delay, and sanction questions to 「대외무상협력사업에 관한 조달 및 계약규정」 and its 시행세칙; personnel, leave, and discipline questions to 「인사규정」 and its 시행세칙; accounting to 「회계규정」.
2. Open the officially published regulation for the governing article. If unavailable, identify the missing text and leave its interpretation open.

3. `find_references` from any located article, in both directions. Incoming references frequently carry the procedure, committee, or approval authority that governs how a substantive rule is applied.
4. `list_attachments` and the official publication when an annex table or form governs.

State which indexed records and official provisions you read. If an official article or attachment remains unavailable, identify it and leave the interpretation open.

## Source attribution

The six regulation tools carry `[Source: koica-regulations]`. The gateway provides metadata, search snippets, annex excerpts, cross-references and citation checks.

For the complete text, open the relevant filing and attachment in ALIO through [KOICA’s regulation guide](https://www.koica.go.kr/koica_kr/8085/subview.do). Cite the publication and revision you actually read.

Attribute what the index returned:

- the regulation title and revision label as `list_sources` gives them, since a citation is only checkable against a stated revision;
- the article numbers the answer rests on, and annex labels when an annex governs;
- whether currency was confirmed against the current official source, and by what means.

That combination lets a reader take the citation to the responsible KOICA unit or the current official regulation source and check it.
