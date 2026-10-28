---
"@stackra/actions": minor
---

Run every action, query and proposal in one `Tracer` span when a tracer is bound: named `<kind> <key>`, with the ADR
0147 attribute names (`action`, `correlationId`, `actorType`, `actorId`, `scopeId`, `origin`, `outcome`, `code`,
`latencyMs`) and no input or output values. A refusal is an outcome, not a failed span (stackra-411, STA-1513).
