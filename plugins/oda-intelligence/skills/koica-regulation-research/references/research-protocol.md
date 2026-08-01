# KOICA regulation research protocol

For consequential personnel, disciplinary, financial, procurement, audit, or program-governance questions:

1. Search broadly by the user's issue, with `include_attachments: true` when an annex table or form may govern.
2. Identify the likely regulation and article, then fetch the complete text with `get_article`, and any governing annex or form with `get_attachment`.
3. Check provisos, definitions, delegation clauses, effective dates, transitional provisions, and referenced annexes or forms in that full text.
4. Follow cross-regulation references with `find_references` when authority or procedure depends on another rule, and check `compliance_radar` when an implementation rule may lag its parent regulation.
5. Separate the indexed KOICA rule from external statutes or factual applicability.
6. For a consequential conclusion, confirm currency against the current official source: the index follows official revisions on a sync cadence, and the revision label states what the index holds.
7. Verify the final citation-bearing text with `verify_citation`.

Use this answer shape:

- Direct answer
- Governing provisions, quoted from the complete article text
- Procedure, criteria, or approval authority
- Exceptions and referenced annexes
- Facts still needed to determine applicability
- Verified citations

If currency against the current official source was not checked, say so explicitly. If the indexed text is incomplete or contradictory, state that the result requires confirmation from the current official regulation source or responsible KOICA unit.

## Source attribution

Every gateway tool declares its domain in its description as `[Source: ...]`. The regulation tools — `search_regulation`, `get_article`, `get_attachment`, `list_attachments`, `list_sources`, `find_references`, `compliance_radar`, and `verify_citation` — all carry `[Source: koica-regulations]`, an index of KOICA internal regulation text.

The underlying regulation text is openly released on the Korean public data portal as **한국국제협력단_정관 및 내부규정** (no usage restrictions). That release is the redistribution basis for the full text these tools return, and it is the address to give a reader who asks where the text is published. The gateway index is the compiled, searchable access path built on it; the two can differ by sync cadence, which is why a citation always carries the revision label.

Attribute what the index returned:

- the regulation title and revision label as `list_sources` gives them, since a citation is only checkable against a stated revision;
- the article numbers the answer rests on, and annex labels when an annex governs;
- whether currency was confirmed against the current official source, and by what means.

That combination lets a reader take the citation to the responsible KOICA unit or the current official regulation source and check it.
