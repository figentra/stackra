---
"@stackra/workflow": minor
---

`workflow.run.get@1`: the person who started a run (or an agent acting for them) and the tenant's services read its
status, end time and its workflow's output so far, the pull path beside the run's events for a caller whose `ctx.run`
answered while the run parked. It is L1 (`workflow.run.get`), scoped to the caller's tenant, and answers
`run_not_found` for any run the caller may not see, so a run's existence never leaks. The engine gains `view(id)`.
