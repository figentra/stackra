---
"@stackra/actions": minor
---

Declare action effect tags with `effects` (`ActionEffects`, snake_case `Effect` codes); make the runtime `tool`
default match gen (an action a user can perform is a tool unless `tool: false`); add the `LimitReservation` port that
wraps an action's unit of work (reserve, then commit); write a successful call's audit entry inside the unit of work;
fail closed when no `ApprovalGate` is bound (bind `OpenApprovalGateDriver` for an app with no approvals); add
`ActionPipeline.propose` (a metered draft with no effects) and the approver rule check `approverRefusal`.
