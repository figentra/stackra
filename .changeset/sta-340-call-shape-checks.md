---
"@stackra/gen": minor
"@stackra/actions": minor
"@stackra/identity": patch
"@stackra/privacy": patch
"@stackra/access-log": patch
"@stackra/loyalty-kit": patch
"@stackra/data-maintenance": patch
"@stackra/media": patch
"@stackra/collaboration": patch
---

Gen refuses a misshapen call. `checkCallShape` runs once per action or query in the manifest pass and refuses a query
whose permission is L2 or above (`query_above_l1`), a query with `preconditions` (`query_precondition`), an action with
`cache` (`action_cache`), an L3 or L4 action a user can call with no `stepUp` (`step_up_missing`) and a client write,
an action with an endpoint or a tool, with no written `idempotency` (`idempotency_missing`). Each refusal carries its
fix. Write `idempotency: Idempotency.Optional` on a client write that is safe to repeat: it is the default the
pipeline already applies, and it now also sets the tool's `idempotentHint`.

The actions pipeline asks `StepUpCheck` only when the caller is a user. A service, job, system or agent call carries
no assurance, so an action that both users and services call can declare `stepUp` and its service callers keep
working; a user call with no `StepUpCheck` bound still fails closed (ADR 0406 as amended).

`identity.operator.bootstrap`, `identity.session.end_user` and `privacy.hold.release` declare
`stepUp: AssuranceLevel.Aal2`, so a user call to them now needs a bound `StepUpCheck`. The client writes of identity,
privacy, access-log, loyalty-kit, data-maintenance, media and collaboration that declared no idempotency write
`Idempotency.Optional`; their manifests gain the `idempotency` entry and `idempotentHint: true`.
