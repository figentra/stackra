---
"@stackra/actions": minor
---

Add the declarative approval stage (STA-1724, ADR 0509). `Action({ approval })` takes `true` or an `ActionApproval`
(`approvals`, `permission`, `expiresAfter` up to 30 days, `when`: an `ApprovalCondition`). `ApprovalGate` is now `decide`,
`park`, `find`, `begin` and `settle`; the pipeline enforces `max(declared, decided)`, verifies a named approval id in core
(`verifyApproval`) against the owning service's `ApprovalBindingStore` binding, parks the request after the isolation
transaction rolled back, forces the key `approval:<id>`, and fails closed without a binding store, an `ActorStatusCheck` or
an `IdentityResolver`. New refusals: `approval_mismatch`, `approval_expired`, `approval_not_granted`, `approval_consumed`,
`approval_pending_limit`, `approval_identity_unavailable`; `approval_required` also carries `approvalsRequired` and
`expiresAt`. `StepUpCheck.require` takes an optional `at`, `ApproverRefusal` gains `already_approved` and
`approver_not_permitted`, and `approverRefusal` uses `actorChainOverlaps`. `./testing` ships `MemoryApprovalGateDriver`,
`MemoryApprovalBindingStoreDriver`, `MemoryActorStatusCheckDriver` and the two port conformance suites.

Breaking for `ApprovalGate` implementers: `check` is replaced by the four methods above.
