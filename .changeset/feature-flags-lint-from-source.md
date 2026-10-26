---
"@stackra/feature-flags": patch
"@stackra/oxlint-config": minor
---

Turn on `feature-flags/no-plan-targeting` in the oxlint base preset, loading the plugin from its source file so lint
needs no build (ADR 0421).
