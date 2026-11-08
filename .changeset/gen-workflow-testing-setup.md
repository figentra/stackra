---
"@stackra/gen": patch
---

A service that declares a workflow gets the `WorkflowRunner` driver table in its wiring (`pipelinePorts`), as
STA-2573 did for the pipeline's other ports: the pipeline resolves the runner for `ctx.run` and `ctx.signal`, and no
constructor injects it, so it was left unbound ("WorkflowRunner is not bound"). The generated Vitest setup also imports
`@stackra/workflow/testing` for a member on `@stackra/workflow`, so a `useDrivers("memory")` test connects that runner.
