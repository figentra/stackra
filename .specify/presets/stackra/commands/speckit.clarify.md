---
description: Resolve open questions; mark the spec complete only when none remain.
strategy: wrap
---

{CORE_TEMPLATE}

## Stackra: completion marker

When no `[NEEDS CLARIFICATION` marker remains anywhere in the spec, every `## Impact` answer is
filled, and `**Linear**` holds a real `STA-n` key, set `**Clarifications status**: complete`.
Otherwise leave it `pending` and list what is still open. Verify with
`node tools/scripts/spec-gate.mjs plan <spec.md>`. A missing Linear issue is created with
`node tools/scripts/spec-linear.mjs issue <spec.md>` (or the Linear MCP when run by an agent).
