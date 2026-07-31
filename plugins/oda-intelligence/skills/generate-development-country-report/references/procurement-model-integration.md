# ODA formation and procurement model integration

Use this reference when writing section 6, `사업 참여·파트너·조달 여건`.

## Retrieval

Call `procurement_model_status` with the report country first. It resolves the country from a
slug, ISO3 code, Korean name, or English name and reports which of the three axes exist and how
each was verified. Treat it as the gate for this section: a missing axis is `no_data`, never
evidence that no formal process exists.

Then retrieve what the section needs:

| Axis | Section | Tool |
|---|---|---|
| `pipeline` — ODA project formation | 6.1 | `procurement_model_detail` with `axis: "pipeline"` |
| `governance` — procurement governance and oversight | 6.3 | `procurement_model_detail` with `axis: "governance"` |
| `bidding` — bidding system | 6.3 | `procurement_model_detail` with `axis: "bidding"` |

Use `procurement_country_context` when the section needs the three axes side by side rather than
one full process graph. It returns the canvas summary, stage and node counts, and verification
state per axis without the graph.

In Korean reader-facing prose and diagram titles, call the first model `ODA 사업 발굴·형성 절차` and the third `입찰제도`. Keep `pipeline` only in technical evidence.

The governance and bidding models are complementary, not interchangeable. Governance answers who holds the authority and who reviews; bidding answers how a tender is advertised, submitted, evaluated, and awarded. When both exist, section 6.3 covers control structure first and the tender procedure second. Do not merge them into one diagram.

## Evidence treatment

Use `model_url` to see the intended actor-by-stage layout. Use the tool response to inspect:

- `canvas.applicability`, `authorities`, `legalBasis`, `procedure`, `bottlenecks`, and `entryBarriers` — present on all three axes
- `canvas.purpose`, `stakeholders`, and `submittedDocuments` — present on `pipeline` and `governance` only; do not treat their absence on a `bidding` model as missing data
- `process.lanes`, `stages`, `nodes`, and `edges`
- `sourceRefs`
- `verification.status`, `method`, `scope`, `sources`, and `discrepancies`
- `fieldVerification` and `unresolved`

The model is a structured secondary source and the model page is a visual synthesis. Neither replaces the underlying law, regulation, official procedure, financing agreement, or donor rule.

- Trace material claims to the official or primary URLs in `verification.sources` when available.
- Cite the exact model page beside the adapted diagram so the synthesis remains reproducible.
- Preserve the model reference date and verification scope.
- Carry provisional law, superseded law, untranslated source text, unverified internal procedure, and field-verification needs into the report limitations.
- If the model is absent, failed, or insufficiently supported, record `no_data` or `판단 불충분` in technical evidence and omit the diagram. Do not invent a generic country process.
- Some official links are withheld when the publisher serves them from a signed or non-https address. The response says how many were withheld; follow the model page or the publishing authority for those.

## Official-source fallback when a model is absent

Model absence prevents an inferred diagram, not section 6 analysis. Use official law, regulations, the national procurement portal, financing agreements, and donor procurement rules to verify only what the sources support:

- funding-source classification and the rule hierarchy for external finance
- national procurement authority and contracting entity
- supplier registration and eligibility
- procurement methods and publication duties
- complaint, audit, inspection, and contract-management controls

Present simple rules in prose or a compact table. Separate confirmed law from unresolved institutional handoffs. State that the country-specific formation or governance model was unavailable, identify the missing relationship, and use `판단 불충분` only for that relationship. Do not cite the absent model as proof that no formal process exists.

## Diagram 1: ODA 사업 발굴·형성 절차

Place this under section 6.1, `현실적인 참여경로`.

Build a simplified actor-by-stage or swimlane visual showing only the handoffs that matter for entry:

- recipient ministry or implementing institution identifies and submits demand
- grant and loan routes split to their respective coordinating authorities
- the coordinating authority checks national priorities and forwards or negotiates the request
- the development partner applies its internal selection route
- for KOICA, show PCP, preliminary study, and PD review only when supported
- show Korean review or officialization only to the level supported by evidence

Preserve consequential branches, required official letters, and changes in counterpart. Do not imply that a submitted concept, preliminary study, PCP, or PD is an approved budget, open solicitation, or contract.

## Diagram 2: 조달 거버넌스·감독체계

Place this under section 6.3, `조달·계약 통제`.

Build a simplified governance visual showing:

- the initial funding-source classification
- the authority responsible for domestically funded procurement
- the authority responsible for externally funded procurement
- the contracting or procuring entity
- the role of the development partner and financing agreement
- audit, post-review, inspection, or complaint oversight when supported

Highlight where the applicable rules or supervising authority change. Do not present provisional thresholds, draft regulations, or unresolved institutional powers as settled.

## Rendering rules

- Prefer Mermaid for portable Markdown; use a static SVG/PNG when swimlanes or dense labels do not render legibly.
- Rebuild a report-specific visual from the supported nodes and edges. Never paste a screenshot of the full interactive page or one-page canvas.
- Keep labels in the report language and define acronyms on first use.
- Use the fewest nodes that preserve the decisive branches and handoffs.
- Put source, reference date, coverage, verification status, and material limitations immediately beside each visual.
- Keep exact procedural details in adjacent prose or a table when they are needed for action.
- Apply the visualization utility gate. If the adapted visual does not reduce interpretation effort, omit it and keep the prose or table.

Do not add the bidding-system model as a default third diagram. Thresholds, notice periods, eligibility documents, and similar compact comparisons usually belong in a table. Add a bidding-process visual only when a consequential branching path cannot be communicated clearly otherwise.
