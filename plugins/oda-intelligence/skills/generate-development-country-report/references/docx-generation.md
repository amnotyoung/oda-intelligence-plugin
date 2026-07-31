# DOCX generation

Use this workflow only when the user requests a Word or `.docx` country report.

## Build from the validated report

1. Read and follow the available document-creation skill, including its render-and-inspect gate.
2. Load the workspace document runtime and libraries. Do not use system Python or globally installed packages.
3. Build from the validated Markdown report and the same dated visual assets. Keep the Markdown source unless the user explicitly requests DOCX only.
4. Write the DOCX beside the Markdown source with the same basename.

## Apply deterministic Word formatting

- Set the font family and size explicitly on paragraph styles and runs. For Korean text, set `ascii`, `hAnsi`, and `eastAsia` font mappings.
- Use whole- or half-point role sizes that Word can represent exactly. Avoid values such as `8.8 pt`, which may serialize differently for ordinary and hyperlink runs.
- Give title, headings, body, table header, table body, caption, source, and footer distinct named roles with fixed sizes.
- Use exact table widths, column widths, indentation, cell margins, repeatable header rows, and non-splitting rows. Do not rely on autofit.
- Embed evidence-bearing PNG/JPEG visuals at a deliberate width. Add descriptive alt text, a source, units, period, and coverage near each visual.
- Use Word's built-in `List Number` style for the manual contents list and `List Bullet` for body and source lists. Do not put direct custom `w:numPr` numbering on report paragraphs.
- Detect Markdown numbered items before joining adjacent prose lines. Write every numbered item as its own Word paragraph; never concatenate `1.`, `2.`, and later items into one paragraph.
- Use a separate built-in numbering stream such as `List Number 2` for numbered endnotes or body lists so they restart at 1 instead of continuing the manual contents list. Apply the same explicit font, indent, spacing, and line-height tokens as the report's other list styles.

### Hyperlinks

`python-docx` does not include runs nested in `w:hyperlink` in `paragraph.runs`. Create hyperlink runs with explicit formatting instead of relying on paragraph or Hyperlink-style inheritance.

Each hyperlink run must contain:

- `w:rFonts` with the same font mappings as surrounding text
- `w:sz` and `w:szCs` matching the surrounding role
- the intended color and underline
- `w:b` or `w:i` when the surrounding role requires it

After building, assert that every `w:hyperlink/w:r` has both size elements. In each table column, confirm that linked and unlinked text use the same size.

## Render and inspect

Use the document skill's bundled renderer:

```text
<workspace-python> <documents-skill>/render_docx.py <report.docx> \
  --output_dir <qa-directory> --emit_pdf
```

Open every rendered page at original detail. Check:

- no clipped, overlapping, or missing text
- inside every chart image: category labels that do not overlap, an unclipped axis title, and a visible value on each bar or point
- uniform font size within each semantic role and table column
- no continued numbering where bullets are intended
- wrapped list lines align under their text
- tables fit, wrap naturally, and retain consistent padding
- visuals, captions, headers, footers, and page numbers remain aligned
- no unintended page-count or section-orientation changes

Fix any defect in the builder, regenerate the DOCX, and rerender all pages.

## Structural QA

Run the document skill's `images_audit.py` and `table_geometry.py`, then run `unzip -t` on the DOCX.

Also assert:

- every hyperlink run has explicit font and size properties
- table hyperlinks and plain text use the same role size
- contents paragraphs use `List Number`
- bullet paragraphs use `List Bullet`
- numbered body/endnote items are separate paragraphs, use a list style distinct from the contents, and visibly restart at 1
- report paragraphs contain no direct custom numbering properties
- the DOCX contains the expected tables, images, sections, and prohibited-phrase checks

Deliver the DOCX only. Do not expose QA PNGs or the temporary PDF unless the user asks for them.
