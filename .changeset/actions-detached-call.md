---
"@stackra/actions": minor
---

`ctx.detach()` holds an action's isolation past its transaction, for a stream or a long agent loop. Each `detached.isolated(work)` step runs in a new `CallIsolation` transaction with the call's settled actor and scope, commits or rolls back alone, and holds no connection between steps. `RequestContext.detached()` answers inside `detached.run(...)`, so a service below the loop can open its own step. `fakeActionContext()` gains a `detach()` that runs each step as it is.
