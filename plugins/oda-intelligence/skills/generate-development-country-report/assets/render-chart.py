#!/usr/bin/env python3
"""Render a country-report chart deterministically.

Charts in this report are read by people who do not have the underlying table.
A chart whose category labels collide, whose axis title is clipped, or whose
bars carry no values is worse than the sentence it replaced, so layout is
decided here instead of being improvised per report.

    python3 render-chart.py <spec.json> --output <chart.png>

The renderer writes the PNG and a `<chart.png>.meta.json` sidecar. The report
validator requires that sidecar, which is how a hand-drawn chart that skipped
this script fails validation.

Spec (schema_version 1):

    {
      "schema_version": 1,
      "type": "bar",                  // "bar" or "line"
      "design_profile": "koica",      // optional: "neutral" or "koica"
      "title": "우즈베키스탄 한국 개발협력 시행기관 구성",
      "value_label": "사업 건수",
      "categories": ["KOICA", "EDCF", ...],
      "values": [86, 23, ...],
      "highlight": 0,                 // optional index to emphasise
      "source": "한국 ODA 사업 위치 지도(비공식)",
      "unit": "사업 건수",
      "period": "기준일 2026-07-31",
      "coverage": "지도 등재 상위 10개 기관"
    }

`source`, `unit`, `period`, and `coverage` are required: a chart without them
cannot pass the report's evidence-caption rule, so the renderer refuses early
rather than producing an image that will be rejected later.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import textwrap
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import font_manager  # noqa: E402

SCHEMA_VERSION = 1
RENDERER = "render-chart.py"
KOICA_PROFILE_PATH = Path(__file__).with_name("koica-design-profile.json")

# Korean glyphs render as tofu when none of these is installed, and matplotlib
# reports that only as a warning. Resolve it up front and fail loudly instead.
KOREAN_FONTS = (
    "Apple SD Gothic Neo",
    "AppleGothic",
    "Pretendard",
    "Noto Sans CJK KR",
    "Noto Sans KR",
    "NanumGothic",
    "Nanum Gothic",
    "Malgun Gothic",
    "Source Han Sans KR",
)

ACCENT = "#1f4e79"
NEUTRAL = "#9fb0c0"
INK = "#1a1a1a"
GRID = "#d9dee3"

# Vertical tick labels stop being readable well before they stop fitting.
# Past either threshold the chart turns horizontal, where a long Korean agency
# or sector name has a whole line to itself.
MAX_VERTICAL_CATEGORIES = 6
MAX_VERTICAL_LABEL = 8
VERTICAL_WRAP = 8
VERTICAL_WRAP_LINES = 2
HORIZONTAL_LABEL_LIMIT = 24

def resolve_korean_font() -> str:
    available = {font.name for font in font_manager.fontManager.ttflist}
    for name in KOREAN_FONTS:
        if name in available:
            return name
    raise SystemExit(
        "No Korean-capable font is installed, so labels would render as boxes. "
        f"Install one of: {', '.join(KOREAN_FONTS)}."
    )

def load_spec(path: Path) -> dict:
    try:
        spec = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"Cannot read chart spec: {error}") from error

    if spec.get("schema_version") != SCHEMA_VERSION:
        raise SystemExit(f"Chart spec must use schema_version {SCHEMA_VERSION}.")

    chart_type = spec.get("type", "bar")
    if chart_type not in {"bar", "line"}:
        raise SystemExit("Chart type must be 'bar' or 'line'.")

    design_profile = spec.get("design_profile", "neutral")
    if design_profile not in {"neutral", "koica"}:
        raise SystemExit("Chart design_profile must be 'neutral' or 'koica'.")
    spec["design_profile"] = design_profile

    categories = spec.get("categories")
    values = spec.get("values")
    if not isinstance(categories, list) or not isinstance(values, list):
        raise SystemExit("Chart spec needs 'categories' and 'values' arrays.")
    if len(categories) != len(values) or not categories:
        raise SystemExit("Chart spec needs matching, non-empty categories and values.")
    if any(not isinstance(value, (int, float)) for value in values):
        raise SystemExit("Chart values must be numbers.")

    # The report standard rejects a chart of one or two observations. Catching
    # it here keeps a pointless image out of the document in the first place.
    if len(categories) < 3:
        raise SystemExit(
            "A chart of fewer than three observations does not beat a sentence. "
            "State the values in prose or a compact table instead."
        )

    for field in ("title", "value_label", "source", "unit", "period", "coverage"):
        if not str(spec.get(field, "")).strip():
            raise SystemExit(f"Chart spec is missing required field '{field}'.")

    highlight = spec.get("highlight")
    if highlight is not None and not (
        isinstance(highlight, int) and 0 <= highlight < len(categories)
    ):
        raise SystemExit("Chart 'highlight' must be a valid category index.")

    return spec

def apply_design_profile(profile_id: str) -> None:
    """Select a shared chart palette without duplicating brand tokens."""

    global ACCENT, NEUTRAL, INK, GRID
    if profile_id == "neutral":
        ACCENT = "#1f4e79"
        NEUTRAL = "#9fb0c0"
        INK = "#1a1a1a"
        GRID = "#d9dee3"
        return
    try:
        profile = json.loads(KOICA_PROFILE_PATH.read_text(encoding="utf-8"))
        colors = profile["colors"]
        if profile["profile_id"] != "koica":
            raise KeyError("profile_id")
        ACCENT = colors["primary"]
        NEUTRAL = colors["gray_300"]
        INK = colors["ink"]
        GRID = colors["gray_300"]
    except (OSError, json.JSONDecodeError, KeyError) as error:
        raise SystemExit(f"Cannot load KOICA chart design profile: {error}") from error

def wrap_vertical(label: str) -> str:
    lines = textwrap.wrap(str(label), width=VERTICAL_WRAP) or [""]
    if len(lines) > VERTICAL_WRAP_LINES:
        lines = lines[:VERTICAL_WRAP_LINES]
        lines[-1] = f"{lines[-1][: VERTICAL_WRAP - 1]}…"
    return "\n".join(lines)

def shorten_horizontal(label: str) -> str:
    text = str(label)
    if len(text) <= HORIZONTAL_LABEL_LIMIT:
        return text
    return f"{text[: HORIZONTAL_LABEL_LIMIT - 1]}…"

def format_value(value: float) -> str:
    if float(value).is_integer():
        return f"{int(value):,}"
    return f"{value:,.1f}"

def bar_colors(count: int, highlight: int | None) -> list[str]:
    if highlight is None:
        return [ACCENT] * count
    return [ACCENT if index == highlight else NEUTRAL for index in range(count)]

def style_axes(axes) -> None:
    for side in ("top", "right"):
        axes.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        axes.spines[side].set_color(GRID)
    axes.tick_params(colors=INK, length=0)

def render_horizontal_bar(spec: dict, categories: list[str], values: list[float]):
    height = max(3.2, 0.46 * len(categories) + 1.5)
    figure, axes = plt.subplots(figsize=(10, height))
    positions = range(len(categories))
    highlight = spec.get("highlight")

    # Read top-to-bottom: the first category belongs at the top of the axis.
    axes.barh(
        list(positions),
        values,
        color=bar_colors(len(categories), highlight),
        height=0.62,
    )
    axes.set_yticks(list(positions))
    axes.set_yticklabels([shorten_horizontal(name) for name in categories], fontsize=11)
    axes.invert_yaxis()
    axes.set_xlabel(spec["value_label"], fontsize=11, color=INK)
    axes.xaxis.grid(True, color=GRID, linewidth=0.8)
    axes.set_axisbelow(True)

    span = max(values) - min(0, min(values)) or 1
    for position, value in zip(positions, values):
        axes.text(
            value + span * 0.012,
            position,
            format_value(value),
            va="center",
            ha="left",
            fontsize=10,
            color=INK,
        )
    axes.set_xlim(right=max(values) + span * 0.12)
    style_axes(axes)
    return figure, axes

def render_vertical_bar(spec: dict, categories: list[str], values: list[float]):
    figure, axes = plt.subplots(figsize=(10, 5.4))
    positions = range(len(categories))
    highlight = spec.get("highlight")

    axes.bar(
        list(positions),
        values,
        color=bar_colors(len(categories), highlight),
        width=0.6,
    )
    axes.set_xticks(list(positions))
    axes.set_xticklabels([wrap_vertical(name) for name in categories], fontsize=11)
    axes.set_ylabel(spec["value_label"], fontsize=11, color=INK)
    axes.yaxis.grid(True, color=GRID, linewidth=0.8)
    axes.set_axisbelow(True)

    span = max(values) - min(0, min(values)) or 1
    for position, value in zip(positions, values):
        axes.text(
            position,
            value + span * 0.02,
            format_value(value),
            ha="center",
            va="bottom",
            fontsize=10,
            color=INK,
        )
    axes.set_ylim(top=max(values) + span * 0.14)
    style_axes(axes)
    return figure, axes

def render_line(spec: dict, categories: list[str], values: list[float]):
    figure, axes = plt.subplots(figsize=(10, 5.0))
    axes.plot(
        range(len(categories)),
        values,
        color=ACCENT,
        linewidth=2.2,
        marker="o",
        markersize=6,
    )
    axes.set_xticks(range(len(categories)))
    axes.set_xticklabels([wrap_vertical(name) for name in categories], fontsize=11)
    axes.set_ylabel(spec["value_label"], fontsize=11, color=INK)
    axes.yaxis.grid(True, color=GRID, linewidth=0.8)
    axes.set_axisbelow(True)

    span = (max(values) - min(values)) or (abs(max(values)) or 1)
    for position, value in enumerate(values):
        axes.annotate(
            format_value(value),
            (position, value),
            textcoords="offset points",
            xytext=(0, 9),
            ha="center",
            fontsize=10,
            color=INK,
        )
    axes.set_ylim(top=max(values) + span * 0.16)
    style_axes(axes)
    return figure, axes

def render(spec: dict, output: Path) -> None:
    apply_design_profile(spec["design_profile"])
    plt.rcParams["font.family"] = resolve_korean_font()
    # Korean fonts usually lack U+2212, which matplotlib uses for negatives.
    plt.rcParams["axes.unicode_minus"] = False

    categories = [str(name) for name in spec["categories"]]
    values = [float(value) for value in spec["values"]]
    longest = max(len(name) for name in categories)
    horizontal = (
        spec.get("type", "bar") == "bar"
        and (
            len(categories) > MAX_VERTICAL_CATEGORIES
            or longest > MAX_VERTICAL_LABEL
        )
    )

    if spec.get("type") == "line":
        figure, axes = render_line(spec, categories, values)
    elif horizontal:
        figure, axes = render_horizontal_bar(spec, categories, values)
    else:
        figure, axes = render_vertical_bar(spec, categories, values)

    axes.set_title(spec["title"], fontsize=15, color=INK, pad=16, loc="left")
    figure.savefig(
        output,
        dpi=200,
        facecolor="white",
        # Without this the axis title is clipped whenever the tick labels grow.
        bbox_inches="tight",
        pad_inches=0.25,
    )
    plt.close(figure)

def write_sidecar(spec: dict, spec_path: Path, output: Path) -> Path:
    digest = hashlib.sha256(spec_path.read_bytes()).hexdigest()
    sidecar = output.with_name(f"{output.name}.meta.json")
    sidecar.write_text(
        json.dumps(
            {
                "schema_version": SCHEMA_VERSION,
                "kind": "chart",
                "renderer": RENDERER,
                "design_profile": spec["design_profile"],
                "spec_sha256": digest,
                "source": spec["source"],
                "unit": spec["unit"],
                "period": spec["period"],
                "coverage": spec["coverage"],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return sidecar

def main() -> int:
    parser = argparse.ArgumentParser(description="Render a country-report chart.")
    parser.add_argument("spec", type=Path, help="Chart spec JSON path")
    parser.add_argument("--output", type=Path, required=True, help="PNG output path")
    options = parser.parse_args()

    if options.output.suffix.lower() != ".png":
        raise SystemExit("Chart output must be a .png path.")

    spec = load_spec(options.spec)
    options.output.parent.mkdir(parents=True, exist_ok=True)
    render(spec, options.output)
    sidecar = write_sidecar(spec, options.spec, options.output)

    print(f"Wrote {options.output}")
    print(f"Wrote {sidecar}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
