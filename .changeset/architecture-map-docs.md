---
"@figentra/docs": patch
---

Architecture map page (`guides/architecture-map`) with its generator `tools/scripts/architecture-map.mjs` (candidate in `scripts/architecture-map/`), which draws the workspace tiers, categories, runtimes and service client calls with the vendored archify skill; `pnpm validate` fails when the committed map drifts (STA-1373).
