---
description: Plan the feature; refuses until the spec gate passes.
strategy: wrap
---

## Stackra: gate (runs first)

`setup-plan.sh` runs `tools/scripts/spec-gate.mjs plan` and exits non-zero until the spec has
`**Clarifications status**: complete`, a `**Linear**: STA-n` key and a fully answered `## Impact`
section. If it fails, STOP: print its output, tell the user to run `/speckit.clarify`, and write
nothing. Never edit the marker yourself to get past the gate.

{CORE_TEMPLATE}
