---
name: koica-regulation-research
description: Search KOICA internal regulations and read the indexed Markdown of articles, annexes and forms through the ODA Intelligence public gateway. Verify citations for questions about KOICA personnel, leave, pay, promotion, discipline, organization, accounting, contracts, procurement, audits, welfare, country programs, partnerships or training rules. Use the returned revision when reporting findings.
---

# Research KOICA Regulations

Use the gateway to find the governing provision, read its full text and verify the citation.
Read [references/research-protocol.md](references/research-protocol.md) for multi-step or consequential questions.

## Workflow

1. Use `search_regulation` to identify the regulation and article. Set `include_attachments: true` when an annex or form may govern. If search is unavailable, use `list_sources` to identify the regulation and `list_attachments` for annex labels.
2. Call `get_article` with the exact regulation name in `source` and the article number in `article`. For an annex or form, call `get_attachment` with the exact regulation name and the returned `label`. If the user supplied both identifiers, start with the full-text call.
3. Read `result[0].body`. While `next_cursor` has a value, repeat the same lookup with that value in `cursor`. Append each page verbatim to the body for its `match_index`. A null cursor completes the lookup. If the cursor changes validity after an index update, discard the partial reading and restart. A blocked or missing page leaves the text incomplete.
4. Use the extracted text to check definitions, conditions, exceptions, effective dates, transitional provisions and referenced annexes. Follow material references with `find_references` and use `compliance_radar` when revision lag matters.
5. Cite the returned regulation name, article or annex label and revision. Verify each final article citation with `verify_citation` (up to 500 characters per input). Resolve `content_mismatch` against the title in `get_article` and recheck. For `not_found` or `unknown_source`, correct the reference or identify it as unverified. An `ok` result verifies the title only when `title_verified` is true.

## Evidence and scope

- Answer from the indexed revision and say which article and annex you read. If the user asks for independent confirmation of the latest official filing, distinguish that check from the indexed revision.
- Keep governing exceptions and factual assumptions explicit. Quote only the text needed to support the answer.
- Distinguish KOICA internal rules from external law. Never call `search_regulation` merely because an ODA activity mentions KOICA. Use `international-oda-data-lookup` for DAC/CRS classifications unless the question concerns an internal KOICA procedure.
