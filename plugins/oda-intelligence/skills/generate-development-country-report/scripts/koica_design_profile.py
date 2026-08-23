#!/usr/bin/env python3
"""Resolve and validate the optional KOICA country-report design profile.

The public skill carries design tokens and asset roles, but not KOICA binary
assets. A caller supplies the design-kit directory at run time. This keeps a
public installation portable and prevents a workstation-specific absolute
path from leaking into the skill or the generated report.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import struct
import subprocess
import sys
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape

PROFILE_PATH = (
    Path(__file__).resolve().parents[1]
    / "assets"
    / "koica-design-profile.json"
)
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

class DesignProfileError(ValueError):
    """Raised when a profile, asset, or font cannot satisfy the brand gate."""

def load_profile(path: Path = PROFILE_PATH) -> dict[str, Any]:
    try:
        profile = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise DesignProfileError(f"Cannot read KOICA design profile: {error}") from error

    required_top_level = {
        "schema_version",
        "profile_id",
        "activation",
        "document",
        "typography",
        "colors",
        "logo",
        "assets",
        "usage",
    }
    missing = sorted(required_top_level - profile.keys())
    if missing:
        raise DesignProfileError(
            f"KOICA design profile is missing fields: {', '.join(missing)}"
        )
    if profile["schema_version"] != 1:
        raise DesignProfileError("KOICA design profile must use schema_version 1")
    if profile["profile_id"] != "koica" or profile["activation"] != "explicit":
        raise DesignProfileError(
            "KOICA design profile must remain explicit and use profile_id 'koica'"
        )
    if profile["usage"].get("authority_mark_automatic") is not False:
        raise DesignProfileError("Authority Mark must never be enabled automatically")
    if profile["usage"].get("wfk_ci_automatic") is not False:
        raise DesignProfileError("WFK CI must never be enabled automatically")
    return profile

def _png_metadata(path: Path) -> dict[str, Any]:
    try:
        header = path.read_bytes()[:26]
    except OSError as error:
        raise DesignProfileError(f"Cannot read asset {path}: {error}") from error
    if len(header) < 26 or header[:8] != PNG_SIGNATURE or header[12:16] != b"IHDR":
        raise DesignProfileError(f"Asset is not a valid PNG: {path}")
    width, height = struct.unpack(">II", header[16:24])
    color_type = header[25]
    return {
        "width_px": width,
        "height_px": height,
        "has_alpha": color_type in {4, 6},
    }

def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def resolve_assets(
    profile: dict[str, Any], kit_path: Path | None
) -> dict[str, Any]:
    if kit_path is None:
        return {
            "status": "not_configured",
            "ready_for_branded_output": False,
            "required": {},
            "conditional": {},
            "reference_only": [],
        }
    kit_path = kit_path.expanduser().resolve()
    if not kit_path.is_dir():
        raise DesignProfileError(f"KOICA design-kit directory does not exist: {kit_path}")

    resolved_required: dict[str, Any] = {}
    missing: list[str] = []
    for role, rule in profile["assets"]["required"].items():
        path = kit_path / rule["path"]
        if not path.is_file():
            missing.append(rule["path"])
            continue
        metadata = _png_metadata(path)
        if metadata["width_px"] < int(rule["minimum_width_px"]):
            raise DesignProfileError(
                f"Asset {path} is too small for role {role}: "
                f"{metadata['width_px']}px"
            )
        if rule.get("requires_alpha") and not metadata["has_alpha"]:
            raise DesignProfileError(f"Asset {path} must preserve transparency")
        resolved_required[role] = {
            "path": str(path),
            "sha256": _sha256(path),
            **metadata,
        }
    if missing:
        raise DesignProfileError(
            "KOICA design kit is missing required assets: " + ", ".join(missing)
        )

    conditional = {
        role: str(kit_path / relative_path)
        for role, relative_path in profile["assets"]["conditional"].items()
        if (kit_path / relative_path).is_file()
    }
    reference_only = [
        str(kit_path / relative_path)
        for relative_path in profile["assets"]["reference_only"]
        if (kit_path / relative_path).is_file()
    ]
    return {
        "status": "ready",
        "ready_for_branded_output": True,
        "kit_path": str(kit_path),
        "required": resolved_required,
        "conditional": conditional,
        # These files contain construction grids and are intentionally not
        # returned as output artwork.
        "reference_only": reference_only,
    }

def _fontconfig_match(family: str) -> dict[str, str] | None:
    executable = shutil.which("fc-match")
    if executable is None:
        return None
    result = subprocess.run(
        [executable, "-f", "%{family}\n%{file}\n", family],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    if len(lines) < 2:
        return None
    matched_families = [name.strip() for name in lines[0].split(",")]
    if family.casefold() not in {name.casefold() for name in matched_families}:
        return None
    font_path = Path(lines[1])
    if not font_path.is_file():
        return None
    return {"family": family, "path": str(font_path), "source": "fontconfig"}

def _explicit_font_match(
    font_file: Path, candidates: list[str]
) -> dict[str, str] | None:
    font_file = font_file.expanduser().resolve()
    if not font_file.is_file():
        raise DesignProfileError(f"Explicit font file does not exist: {font_file}")
    executable = shutil.which("fc-scan")
    if executable is None:
        raise DesignProfileError(
            "fc-scan is required to verify an explicitly supplied font file"
        )
    result = subprocess.run(
        [executable, "-f", "%{family}\n", str(font_file)],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise DesignProfileError(f"Cannot inspect explicit font file: {font_file}")
    families = {
        name.strip().casefold()
        for line in result.stdout.splitlines()
        for name in line.split(",")
        if name.strip()
    }
    for candidate in candidates:
        if candidate.casefold() in families:
            return {
                "family": candidate,
                "path": str(font_file),
                "source": "explicit_file",
            }
    raise DesignProfileError(
        "Explicit font is not Noto Sans KR or an approved fallback: "
        f"{font_file}"
    )

def resolve_font(
    profile: dict[str, Any], font_file: Path | None = None
) -> dict[str, Any]:
    typography = profile["typography"]
    candidates = [typography["primary"], *typography["fallbacks"]]
    if font_file is not None:
        match = _explicit_font_match(font_file, candidates)
        assert match is not None
        return {
            "status": "ready",
            "is_primary": match["family"] == typography["primary"],
            **match,
        }
    for family in candidates:
        match = _fontconfig_match(family)
        if match:
            return {
                "status": "ready",
                "is_primary": family == typography["primary"],
                **match,
            }
    return {
        "status": "missing",
        "is_primary": False,
        "requested": candidates,
    }

def resolve_profile(
    *,
    kit_path: Path | None = None,
    font_file: Path | None = None,
    require_assets: bool = False,
    require_font: bool = False,
) -> dict[str, Any]:
    profile = load_profile()
    assets = resolve_assets(profile, kit_path)
    font = resolve_font(profile, font_file)
    if require_assets and not assets["ready_for_branded_output"]:
        raise DesignProfileError(
            "KOICA branded output requires an explicitly supplied design-kit path"
        )
    if require_font and font["status"] != "ready":
        raise DesignProfileError(
            "KOICA branded output requires Noto Sans KR or an approved fallback font"
        )
    return {
        "profile": profile,
        "assets": assets,
        "font": font,
    }

def prepare_fontconfig(font_file: Path, output: Path) -> Path:
    """Create an isolated fontconfig that makes one approved font renderable."""

    font_file = font_file.expanduser().resolve()
    output = output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    cache = output.parent / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    output.write_text(
        "<?xml version=\"1.0\"?>\n"
        "<!DOCTYPE fontconfig SYSTEM \"urn:fontconfig:fonts.dtd\">\n"
        "<fontconfig>\n"
        f"  <dir>{escape(str(font_file.parent))}</dir>\n"
        f"  <cachedir>{escape(str(cache))}</cachedir>\n"
        "</fontconfig>\n",
        encoding="utf-8",
    )
    executable = shutil.which("fc-cache")
    if executable is None:
        raise DesignProfileError("fc-cache is required to prepare the render font")
    environment = os.environ.copy()
    environment["FONTCONFIG_FILE"] = str(output)
    result = subprocess.run(
        [executable, "-f"],
        check=False,
        capture_output=True,
        text=True,
        env=environment,
    )
    if result.returncode != 0:
        raise DesignProfileError(
            f"Cannot prepare fontconfig for {font_file}: {result.stderr.strip()}"
        )
    return output

def mm_to_inches(value: float) -> float:
    return value / 25.4

def apply_to_legacy_builder(builder: Any, resolved: dict[str, Any]) -> None:
    """Apply KOICA tokens to the existing country-specific DOCX builders.

    New builders should consume the profile directly. This adapter keeps the
    verified legacy Markdown-to-DOCX implementation while one shared theme
    replaces its repeated colour, typography, page, and table constants.
    """

    profile = resolved["profile"]
    font = resolved["font"]
    if font["status"] != "ready":
        raise DesignProfileError("Cannot theme a DOCX builder without an approved font")
    colors = {key: value.removeprefix("#") for key, value in profile["colors"].items()}
    roles = profile["typography"]["roles_pt"]
    page = profile["document"]
    margins = page["margins_mm"]

    assignments = {
        "LATIN_FONT": font["family"],
        "EAST_ASIA_FONT": font["family"],
        "FONT_PATH": Path(font["path"]),
        "NAVY": colors["primary"],
        "BLUE": colors["primary"],
        "DARK_BLUE": colors["primary"],
        "MUTED": colors["gray_600"],
        "LIGHT_GRAY": colors["gray_100"],
        "MID_GRAY": colors["gray_300"],
        "GRID": colors["gray_300"],
        "WHITE": colors["white"],
        "BODY": colors["ink"],
        "LINK_BLUE": colors["primary"],
        "GOLD": colors["orange"],
        "TEAL": colors["teal"],
        "SKY": colors["sky"],
        "SOFT_BLUE": colors["soft_blue"],
        "SOFT_TEAL": colors["soft_teal"],
        "SOFT_GOLD": colors["soft_orange"],
        "PAGE_WIDTH_INCHES": mm_to_inches(page["width_mm"]),
        "PAGE_HEIGHT_INCHES": mm_to_inches(page["height_mm"]),
        "MARGIN_TOP_INCHES": mm_to_inches(margins["top"]),
        "MARGIN_RIGHT_INCHES": mm_to_inches(margins["right"]),
        "MARGIN_BOTTOM_INCHES": mm_to_inches(margins["bottom"]),
        "MARGIN_LEFT_INCHES": mm_to_inches(margins["left"]),
        "HEADER_DISTANCE_INCHES": mm_to_inches(page["header_distance_mm"]),
        "FOOTER_DISTANCE_INCHES": mm_to_inches(page["footer_distance_mm"]),
        "COVER_TITLE_FONT_SIZE": roles["cover_title"],
        "COVER_SUBTITLE_FONT_SIZE": roles["cover_subtitle"],
        "HEADING_1_FONT_SIZE": roles["section_heading"],
        "HEADING_2_FONT_SIZE": roles["subsection_heading"],
        "HEADING_3_FONT_SIZE": roles["minor_heading"],
        "BODY_FONT_SIZE": roles["body"],
        "PORTRAIT_TABLE_FONT_SIZE": roles["table_portrait"],
        "LANDSCAPE_TABLE_FONT_SIZE": roles["table_landscape"],
        "RISK_TABLE_FONT_SIZE": roles["risk_table"],
        "CAPTION_FONT_SIZE": roles["caption"],
        "FOOTER_FONT_SIZE": roles["footer"],
        "PORTRAIT_WIDTH_DXA": round(
            mm_to_inches(page["width_mm"] - margins["left"] - margins["right"])
            * 1440
        ),
        "LANDSCAPE_WIDTH_DXA": round(
            mm_to_inches(page["height_mm"] - margins["left"] - margins["right"])
            * 1440
        ),
        "DESIGN_PROFILE_ID": profile["profile_id"],
    }
    for name, value in assignments.items():
        setattr(builder, name, value)

    builder.set_run_font.__kwdefaults__.update(
        {
            "color": builder.BODY,
            "latin": builder.LATIN_FONT,
            "east_asia": builder.EAST_ASIA_FONT,
        }
    )
    if hasattr(builder, "add_hyperlink"):
        builder.add_hyperlink.__kwdefaults__["size"] = builder.BODY_FONT_SIZE
    if hasattr(builder, "add_inline_markdown"):
        builder.add_inline_markdown.__kwdefaults__.update(
            {
                "default_size": builder.BODY_FONT_SIZE,
                "default_color": builder.BODY,
            }
        )
    if hasattr(builder, "draw_box"):
        builder.draw_box.__kwdefaults__.update(
            {"outline": builder.BLUE, "text_fill": builder.BODY}
        )
    if hasattr(builder, "draw_arrow"):
        builder.draw_arrow.__kwdefaults__["color"] = builder.BLUE

def add_cover_asset(
    paragraph: Any,
    resolved: dict[str, Any],
    role: str,
    *,
    width_mm: float,
    title: str,
    description: str,
) -> Any:
    """Insert an approved, resolved asset with explicit size and alt text."""

    try:
        from docx.shared import Mm
    except ImportError as error:  # pragma: no cover - depends on document runtime
        raise DesignProfileError("python-docx is required to insert brand assets") from error
    asset = resolved["assets"]["required"].get(role)
    if not asset:
        raise DesignProfileError(f"Resolved KOICA asset is missing role {role}")
    shape = paragraph.add_run().add_picture(asset["path"], width=Mm(width_mm))
    shape._inline.docPr.set("title", title)
    shape._inline.docPr.set("descr", description)
    return shape

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Resolve and validate the optional KOICA report design profile."
    )
    parser.add_argument("--kit", type=Path, help="KOICA_AI_Design_Kit directory")
    parser.add_argument(
        "--font-file",
        type=Path,
        help="Explicit Noto Sans KR or approved fallback font file",
    )
    parser.add_argument(
        "--fontconfig-out",
        type=Path,
        help="Prepare an isolated fontconfig for LibreOffice rendering",
    )
    parser.add_argument("--require-assets", action="store_true")
    parser.add_argument("--require-font", action="store_true")
    parser.add_argument("--output", type=Path, help="Write resolved JSON here")
    options = parser.parse_args()

    try:
        resolved = resolve_profile(
            kit_path=options.kit,
            font_file=options.font_file,
            require_assets=options.require_assets,
            require_font=options.require_font,
        )
    except DesignProfileError as error:
        raise SystemExit(str(error)) from error

    if options.fontconfig_out:
        if options.font_file is None:
            raise SystemExit("--fontconfig-out requires --font-file")
        try:
            fontconfig_path = prepare_fontconfig(
                Path(resolved["font"]["path"]), options.fontconfig_out
            )
        except DesignProfileError as error:
            raise SystemExit(str(error)) from error
        resolved["render_environment"] = {
            "FONTCONFIG_FILE": str(fontconfig_path)
        }

    payload = json.dumps(resolved, ensure_ascii=False, indent=2) + "\n"
    if options.output:
        options.output.parent.mkdir(parents=True, exist_ok=True)
        options.output.write_text(payload, encoding="utf-8")
        print(f"Wrote {options.output}")
    else:
        print(payload, end="")
    return 0

if __name__ == "__main__":
    sys.exit(main())
