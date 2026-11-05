---
"@stackra/runway": minor
---

`runway env sync` is `runway secrets sync` under the ADR 0173 amendment of 2026-11-04 (STA-2104): an alias, not a
second tool. The sync, the deploy plan and the Workers provider's secret read now take each member's
manifest-declared names (gen's `env` rows, filtered by their environments) beside its runway `secrets:`, so a name
declared in code reaches its runtime without a runway line. `readRunways` reads the names from each member's
committed `stackra.manifest.json`.
