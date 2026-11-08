---
"@stackra/gen": patch
---

Gen sees `ctx.run<Output>(XWorkflow, input)` as the action starting `XWorkflow`, as it does the untyped call, so an
action may type the run's result and still pass `checkActionFirst`.
