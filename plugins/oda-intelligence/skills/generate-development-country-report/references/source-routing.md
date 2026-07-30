# Source routing

Use the smallest set of tools that can support the claim.

| Need | Gateway source | Preferred sequence |
| --- | --- | --- |
| Supported country and overall evidence status | International data | `country_list` → `country_data_status` |
| Country profile and international context | International data | `country_report_context`; use narrower hazard or humanitarian tools when needed |
| IATI activity discovery | International data | `iati_query_country`; never treat search rows as unique projects without deduplication |
| Korean ODA portfolio and geography | Korean ODA map | `oda_map_data_status` → `oda_map_country_context` → `oda_map_projects` → `oda_map_project_detail` |
| Development-cooperation discovery | Development documents | `list_available_corpora` → `search_development_trends`; open and cite the public original URL separately |
| KOICA internal rule discovery | KOICA regulations | `list_sources` or `search_regulation` → optional `find_references` → `verify_citation`; confirm consequential conclusions against the current official source |

Call `oda_map_projects` with pagination until the relevant population is complete. Deduplicate by stable project or activity identifier, not by displayed map point.

Use the reference date consistently when recalculating project status. Keep source observation dates distinct when sources describe different periods.

When a gateway source is unavailable, continue only with claims supported by the remaining sources and identify the affected section as evidence-limited.
