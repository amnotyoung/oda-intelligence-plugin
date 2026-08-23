#!/usr/bin/env python3
"""Validate KOICA design-profile invariants in a generated DOCX."""

from __future__ import annotations

import argparse
import hashlib
import posixpath
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from koica_design_profile import DesignProfileError, resolve_profile

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    "dc": "http://purl.org/dc/elements/1.1/",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}

def qname(prefix: str, local: str) -> str:
    return f"{{{NS[prefix]}}}{local}"

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def expected_twips(mm: float) -> int:
    return round(mm / 25.4 * 1440)

def validate(
    docx_path: Path,
    kit_path: Path,
    *,
    font_file: Path | None = None,
    require_vi_logotype: bool = False,
) -> list[str]:
    errors: list[str] = []
    try:
        resolved = resolve_profile(
            kit_path=kit_path,
            font_file=font_file,
            require_assets=True,
            require_font=True,
        )
    except DesignProfileError as error:
        return [str(error)]
    profile = resolved["profile"]
    font_family = resolved["font"]["family"]

    try:
        archive = zipfile.ZipFile(docx_path)
    except (OSError, zipfile.BadZipFile) as error:
        return [f"Cannot read DOCX archive: {error}"]
    with archive:
        names = set(archive.namelist())
        for required in (
            "word/document.xml",
            "word/styles.xml",
            "word/_rels/document.xml.rels",
            "docProps/core.xml",
        ):
            if required not in names:
                errors.append(f"DOCX is missing {required}")
        if errors:
            return errors

        document_bytes = archive.read("word/document.xml")
        styles_bytes = archive.read("word/styles.xml")
        relationships_bytes = archive.read("word/_rels/document.xml.rels")
        core_bytes = archive.read("docProps/core.xml")
        document = ET.fromstring(document_bytes)
        relationships = ET.fromstring(relationships_bytes)

        media_hashes = {
            name: sha256(archive.read(name))
            for name in names
            if name.startswith("word/media/")
        }
        required_assets = resolved["assets"]["required"]
        logo_hash = required_assets["communication_blue"]["sha256"]
        logo_media = [name for name, digest in media_hashes.items() if digest == logo_hash]
        if not logo_media:
            errors.append("Communication Mark is not embedded in the DOCX")

        if require_vi_logotype:
            vi_hash = required_assets["vi_logotype_blue"]["sha256"]
            if vi_hash not in media_hashes.values():
                errors.append("VI Logotype is required but not embedded in the DOCX")

        prohibited_paths = [
            *resolved["assets"]["reference_only"],
            str(kit_path / profile["assets"]["restricted"]["authority_mark"]),
            str(kit_path / profile["assets"]["restricted"]["wfk_ci"]),
        ]
        prohibited_hashes = {
            sha256(Path(path).read_bytes())
            for path in prohibited_paths
            if Path(path).is_file()
        }
        embedded_prohibited = [
            name for name, digest in media_hashes.items() if digest in prohibited_hashes
        ]
        if embedded_prohibited:
            errors.append(
                "DOCX embeds restricted or reference-only assets: "
                + ", ".join(embedded_prohibited)
            )

        relationship_targets = {
            relationship.get("Id"): relationship.get("Target")
            for relationship in relationships.findall("rel:Relationship", NS)
        }
        logo_ids = {
            relationship_id
            for relationship_id, target in relationship_targets.items()
            if target
            and posixpath.normpath(posixpath.join("word", target)) in logo_media
        }
        expected_logo_width = round(
            profile["logo"]["document_width_mm"] * 36000
        )
        logo_drawings = []
        for inline in document.findall(".//wp:inline", NS):
            blip = inline.find(".//a:blip", NS)
            if blip is None or blip.get(qname("r", "embed")) not in logo_ids:
                continue
            logo_drawings.append(inline)
            extent = inline.find("wp:extent", NS)
            width = int(extent.get("cx", "0")) if extent is not None else 0
            if abs(width - expected_logo_width) > expected_logo_width * 0.01:
                errors.append(
                    f"Communication Mark width is {width} EMU; "
                    f"expected {expected_logo_width} EMU"
                )
            doc_properties = inline.find("wp:docPr", NS)
            if doc_properties is None or not doc_properties.get("descr", "").strip():
                errors.append("Communication Mark lacks descriptive alt text")
        if logo_media and not logo_drawings:
            errors.append("Communication Mark is embedded but not placed in the document")

        page = profile["document"]
        margins = page["margins_mm"]
        portrait = (
            expected_twips(page["width_mm"]),
            expected_twips(page["height_mm"]),
        )
        landscape = (portrait[1], portrait[0])
        expected_margins = {
            "top": expected_twips(margins["top"]),
            "right": expected_twips(margins["right"]),
            "bottom": expected_twips(margins["bottom"]),
            "left": expected_twips(margins["left"]),
            "header": expected_twips(page["header_distance_mm"]),
            "footer": expected_twips(page["footer_distance_mm"]),
        }
        sections = document.findall(".//w:sectPr", NS)
        if not sections:
            errors.append("DOCX contains no section geometry")
        for index, section in enumerate(sections, start=1):
            size = section.find("w:pgSz", NS)
            if size is None:
                errors.append(f"Section {index} lacks page size")
                continue
            actual_size = (
                int(size.get(qname("w", "w"), "0")),
                int(size.get(qname("w", "h"), "0")),
            )
            expected_size = (
                landscape
                if size.get(qname("w", "orient")) == "landscape"
                else portrait
            )
            if any(abs(actual - expected) > 3 for actual, expected in zip(actual_size, expected_size)):
                errors.append(
                    f"Section {index} is not A4: {actual_size}, expected {expected_size}"
                )
            margin = section.find("w:pgMar", NS)
            if margin is None:
                errors.append(f"Section {index} lacks page margins")
                continue
            for name, expected in expected_margins.items():
                actual = int(margin.get(qname("w", name), "0"))
                if abs(actual - expected) > 3:
                    errors.append(
                        f"Section {index} {name} margin is {actual}; expected {expected}"
                    )

        for run in document.findall(".//w:r", NS):
            visible_text = "".join(
                node.text or "" for node in run.findall(".//w:t", NS)
            )
            if not visible_text:
                continue
            fonts = run.find("w:rPr/w:rFonts", NS)
            if fonts is None:
                errors.append(f"Visible run lacks explicit fonts: {visible_text[:40]!r}")
                continue
            for attribute in ("ascii", "hAnsi", "eastAsia"):
                actual = fonts.get(qname("w", attribute))
                if actual != font_family:
                    errors.append(
                        f"Run {visible_text[:40]!r} uses {attribute}={actual!r}; "
                        f"expected {font_family!r}"
                    )

        combined_xml = document_bytes + styles_bytes
        primary = profile["colors"]["primary"].removeprefix("#").encode("ascii")
        if primary not in combined_xml:
            errors.append("KOICA Blue is absent from document text styles")
        for legacy_color in (b"2E74B5", b"203748", b"A2761B", b"1A5FB4"):
            if legacy_color in combined_xml:
                errors.append(f"Legacy colour {legacy_color.decode()} remains in DOCX XML")

        if b"design-profile:koica" not in core_bytes:
            errors.append("DOCX core metadata does not identify design-profile:koica")
        kit_text = str(kit_path.resolve()).encode("utf-8")
        for name in names:
            if not name.endswith((".xml", ".rels")):
                continue
            if kit_text in archive.read(name):
                errors.append(f"Workstation design-kit path leaked into {name}")

    return errors

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("docx", type=Path)
    parser.add_argument("--kit", type=Path, required=True)
    parser.add_argument("--font-file", type=Path)
    parser.add_argument("--require-vi-logotype", action="store_true")
    options = parser.parse_args()
    errors = validate(
        options.docx,
        options.kit,
        font_file=options.font_file,
        require_vi_logotype=options.require_vi_logotype,
    )
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print(f"Validated KOICA design profile: {options.docx}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
