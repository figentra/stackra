---
"@stackra/actions": minor
"@stackra/queue": minor
---

A queued job's call knows which attempt it is: `ctx.attempt` (`{ number, last }`, the new `CallAttempt` type) on every call context, set by the queue worker through `CallOptions.attempt` and absent for a direct call. `last` is true when no retry follows, so a job that may give up (a quota it cannot read) can act on its last attempt instead of throwing again.
