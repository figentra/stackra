---
"@stackra/workflow": minor
---

Add `@stackra/workflow`: the `Workflow` and `Signal` kind bases, `@Step`, `Run<W>` and `StepContext`, the native engine
behind `ctx.run` and `ctx.signal` (steps in their own transactions and the call's scope, retries, signal waits,
timeouts and compensation) on a Postgres or memory journal, the boot explorer, `WorkflowConfig`, and the in-process test driver.
