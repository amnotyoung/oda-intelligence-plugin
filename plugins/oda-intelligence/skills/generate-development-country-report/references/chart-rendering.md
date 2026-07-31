# Chart rendering

Read this before producing any chart image for the report.

Charts fail in this report for layout reasons, not analytical ones: Korean
category labels collide on a vertical axis, the axis title clips at the canvas
edge, and bars carry no values. Those defects survive every content check
because the surrounding prose is correct. Layout is therefore decided by
[assets/render-chart.py](../assets/render-chart.py), not per report.

## Render every chart through the script

```bash
<workspace-python> <skill-directory>/assets/render-chart.py <spec.json> \
  --output reports/assets/<country-slug>-<chart>-<yyyy-mm-dd>.png
```

Use the workspace document runtime, not system Python or global packages.

The script writes the PNG and a `<chart>.png.meta.json` sidecar. The validator
requires that sidecar for every local image in the report, so a chart drawn by
hand — with an ad-hoc matplotlib call, a screenshot, or any other tool — fails
validation. That is deliberate.

## Spec

```json
{
  "schema_version": 1,
  "type": "bar",
  "title": "우즈베키스탄 한국 개발협력 시행기관 구성 (상위 10개)",
  "value_label": "사업 건수",
  "categories": ["KOICA", "EDCF", "교육부"],
  "values": [86, 23, 20],
  "highlight": 0,
  "source": "ODA Map Lab",
  "unit": "사업 건수",
  "period": "기준일 2026-07-31",
  "coverage": "지도 등재 상위 10개 기관"
}
```

`type` is `bar` or `line`. `highlight` is optional and marks the one category
the adjacent prose argues about. `source`, `unit`, `period`, and `coverage` are
required and are copied into the sidecar; they must match the evidence caption
beside the figure.

Keep the spec beside the technical evidence for the run so the chart can be
rebuilt from the same snapshot.

## What the script decides, and why you must not override it

- **Orientation.** More than six categories, or any label longer than eight
  characters, renders horizontally. This is the single most common defect:
  ten Korean ministry names on a vertical axis overlap into an unreadable
  smear.
- **Label handling.** Vertical labels wrap to two short lines; horizontal
  labels truncate at 24 characters with an ellipsis.
- **Value labels.** Every bar and point carries its value, so a reader never
  has to estimate against the grid.
- **Colour.** One accent colour for the highlighted category and a neutral
  grey for the rest. Colour carries the argument or it carries nothing; do not
  give every category its own hue.
- **Margins.** The figure is saved with tight bounds and padding, which is what
  keeps a rotated axis title from clipping.

## Refusals

The script exits non-zero rather than emitting a defective image when:

- no Korean-capable font is installed, which would render every label as boxes
- the spec has fewer than three observations, which the utility gate rejects
- `source`, `unit`, `period`, or `coverage` is missing

Treat each as a signal to change the report, not to bypass the script. Fewer
than three observations belongs in a sentence or a compact table.

## Non-chart visuals

Maps and process diagrams are not produced by this script, but the validator
still requires a sidecar so that every image in the report declares what it is
and what it rests on. Write it beside the image:

```json
{
  "schema_version": 1,
  "kind": "diagram",
  "source": "partner-country-procurement 모델(검증일 2026-07-29)",
  "unit": "절차 단계",
  "period": "2026-07-29 검증",
  "coverage": "사업 발굴부터 RD·MOU 공식화까지"
}
```

Use `kind` `map` for project maps and `diagram` for process visuals. Mermaid
blocks need no sidecar because they carry no separate image file.
