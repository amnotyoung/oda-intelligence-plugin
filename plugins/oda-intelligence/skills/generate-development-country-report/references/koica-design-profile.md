# KOICA design profile

Read this reference only when the user explicitly requests KOICA-branded
DOCX/PDF output or supplies a KOICA design kit. The profile changes the
presentation layer; it never changes the report's evidence, nine-section
structure, source treatment, or risk judgements.

## Activation and official-status boundary

- Keep the neutral report style by default. Activate `koica` explicitly.
- Confirm the intended document status from the request or workspace. When it
  is not established, label the output `검토용` rather than implying that it is
  an approved KOICA publication.
- Use the Communication Mark for an ordinary report. Never select the
  Authority Mark automatically. Use WFK CI only for a WFK deliverable and only
  when the user has established that scope.
- Do not describe a branded draft as an official KOICA position, approval, or
  publication merely because the visual identity is present.

## Resolve the profile and assets

The public skill includes
[`assets/koica-design-profile.json`](../assets/koica-design-profile.json), not
the binary brand assets. A KOICA kit is a run-time input, not a path to store in
the skill, report, document metadata, or technical evidence.

Before a branded build, run:

```bash
<workspace-python> <skill-directory>/scripts/koica_design_profile.py \
  --kit <koica-design-kit-directory> \
  --font-file <noto-sans-kr-font-file> \
  --require-assets --require-font \
  --fontconfig-out <temporary-directory>/fontconfig/fonts.conf \
  --output <temporary-directory>/resolved-koica-design.json
```

The resolver verifies the four clean Communication Mark/VI Logotype PNGs,
their transparency and minimum size, records their hashes for the build, and
selects Noto Sans KR or an approved fallback. `--font-file` is optional when an
approved font is already installed, but supplying a licensed Noto Sans KR file
also prepares a deterministic fontconfig for headless LibreOffice. A missing kit or font blocks the
branded build; it does not justify drawing a replacement logo or silently
calling a neutral document KOICA-branded.

When the resolver returns `render_environment.FONTCONFIG_FILE`, pass that value
to the document renderer. Do not assume that an installed macOS or Windows
fallback will be usable by a separate headless renderer; the rendered PNG is
the deciding preflight.

`VI_GRID_1.png` through `VI_GRID_4.png` are reference-only because the supplied
files contain construction grids. Do not place them in a finished report.
Use the clean VI Logotype asset as the restrained cover or section motif.

## Document application

Use the profile tokens as one shared source for every builder:

- A4 portrait by default; landscape only for tables or evidence visuals that
  need it
- margins: 22 mm top/bottom and 25 mm left/right
- Noto Sans KR; Apple SD Gothic Neo or Malgun Gothic only as approved fallback
- cover title 24 pt, chapter title 17 pt, body 10.5 pt, table 8-9 pt
- KOICA Blue `#0A46A5` for titles and the primary series
- Ink `#19202C` for body text, Cool Gray for comparison/grid, Orange or Red
  only for a warning or adverse status
- Communication Mark at 28 mm on A4, never below the official 20 mm minimum;
  keep at least 20% of logo height clear on every side
- no background motif in body pages, no gradients, shadows, 3-D charts, or
  decorative stock imagery

Use `scripts/koica_design_profile.py` as the shared Python source for profile
resolution, legacy-builder token application, and cover-asset insertion. Do
not retype the palette or page geometry in a country-specific builder.

## Tables, charts, and diagrams

- Use KOICA Blue or Pale Gray headers, minimal vertical rules, repeated header
  rows, and explicit units.
- Set `"design_profile": "koica"` in each chart spec. The chart sidecar must
  retain that profile ID.
- A process diagram may use KOICA Blue plus one semantic point colour. Keep
  danger/error in Red and caution in Orange; do not assign five brand colours
  merely to decorate categories.
- Do not recolour a project map in a way that changes its evidence legend.
  Align its surrounding caption, border, and typography instead.

## Distribution and QA

- Do not copy the design kit's PNG or PDF files into a public repository or
  public skill package without confirmed redistribution permission.
- Keep the kit outside the repository and pass its path only for the current
  build. Public packaging must remain complete without that path.
- After saving the DOCX, assert A4 geometry, the resolved font mapping, profile
  palette, Communication Mark presence and width, absence of Authority Mark,
  hyperlink sizes, table geometry, and image alt text.
- Run `scripts/validate_koica_docx.py <report.docx> --kit <kit-directory>` and
  pass the same `--font-file` used by the builder when applicable;
  add `--require-vi-logotype` when the chosen cover includes it.
- Render every page through the document workflow and inspect the cover,
  section transitions, charts, landscape tables, headers, footers, page
  numbering, wrapping, clipping, and contrast before delivery.
