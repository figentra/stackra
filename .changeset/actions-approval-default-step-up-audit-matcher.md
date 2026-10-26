---
"@stackra/actions": minor
---

Restore pipelines that bind no `ApprovalGate`: the approval step runs only when a gate is bound, and only an action
that declares `approval: true` fails closed without one (STA-813, ADR 0397 as amended); the testing pipeline no longer
injects an open gate. Add step-up assurance: `CallOptions.assurance` and `ctx.assurance` (`amr`, `authTime`, `level`),
the `AssuranceLevel` enum, the `StepUpCheck` port and the action option `stepUp`, checked right after the permission
and failing closed without a driver (STA-814, ADR 0406). Add the `toHaveAudited` matcher and `RunResult.audit` to
`./testing` (STA-820). Add `postgres` to the store driver names so runway selects @stackra/database's Postgres
idempotency and rate-limit stores (STA-756).
