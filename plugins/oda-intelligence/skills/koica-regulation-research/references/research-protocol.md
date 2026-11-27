# KOICA regulation research protocol

## Reading an indexed provision

Use the exact regulation title returned by `list_sources` or `search_regulation`. Read the
Markdown extracted from the published regulation through the public gateway. For example:

- `get_article({"source":"인사규정","article":"제1조"})` returns the article, title, revision and body.
- `get_attachment({"source":"인사규정","label":"[별표 1]"})` returns the annex label, title, revision and body. Use `list_attachments` to resolve a label, including a 별지 form.

`total` counts matches. Each response carries at most one match and may contain only part of
its body. For each non-null `next_cursor`, repeat the same tool and arguments with that
cursor. Join pages for the same `match_index` without inserting separators. Keep different
matches separate, even when they share a label. Stop when `next_cursor` is null. On
`READING_CURSOR_CHANGED`, restart with the original arguments and discard the earlier pages.

## Interpreting and verifying

For consequential questions, read every material article and annex, including cross-referenced
exceptions and transitional provisions. Use `find_references` to locate connected provisions
and `compliance_radar` to identify implementation rules for which revision lag needs review.
Report the governing rule, relevant conditions and the indexed revision actually read.
The revision records what the index holds. An independent comparison with the latest official
filing is a separate check when specifically requested.

Verify the article number and any quoted title using `verify_citation`. A matching number can
have `title_verified: false`. For `content_mismatch`, check the title returned by `get_article`,
correct the citation and verify again. Cite annexes with the label returned by `get_attachment`.

## Missing or incomplete evidence

When discovery is blocked, use `list_sources`, `find_references` or `list_attachments` to resolve
the exact reference and request its text. If a full-text lookup returns zero matches, check the
regulation name, article number or annex label. If a page remains unavailable, specify the
missing text and leave conclusions that depend on it open.
