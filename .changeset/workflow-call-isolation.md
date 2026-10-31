---
"@stackra/workflow": patch
---

The native runner runs each step and each undo through the bound `CallIsolation` as the actor stored in the run's
`origin`, in the run's scope, inside the journal's transaction (STA-1699, ADR 0495). With none bound it runs as before.
