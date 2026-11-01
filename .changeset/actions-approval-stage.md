---
"@stackra/actions": minor
---

Add the declarative approval stage (STA-1724, ADR 0509). `Action({ approval })` takes `true` or an `ActionApproval`
(`approvals`, `permission`, `expiresAfter` up to 30 days, `when`: an `ApprovalCondition`, whose `needed(input, ctx, settings)` gets its limited settings reader as an argument). `ApprovalGate` is now `decide`,
`park`, `find`, `begin` and `settle`; the pipeline enforces `max(declared, decided)`, verifies a named approval id in core
(`verifyApproval`) against the owning service's `ApprovalBindingStore` binding, parks the request after the isolation
transaction rolled back, forces the key `approval:<id>`, and fails closed without a binding store, an `ActorStatusCheck` or
an `IdentityResolver`. New refusals: `approval_mismatch`, `approval_expired`, `approval_not_granted`, `approval_consumed`,
`approval_pending_limit`, `approval_identity_unavailable`; `approval_required` also carries `approvalsRequired` and
`expiresAt`. `StepUpCheck.require` takes an optional `at`, `ApproverRefusal` gains `already_approved` and
`approver_not_permitted`, and `approverRefusal` uses `actorChainOverlaps`. `./testing` ships `MemoryApprovalGateDriver`,
`MemoryApprovalBindingStoreDriver`, `MemoryActorStatusCheckDriver` and the two port conformance suites. A condition that declares `reads` with no `ApprovalSettingsSource` bound is refused `approval_settings_unavailable` before `needed()` runs.

### Breaking

- `ApprovalGate.check` is removed. The gate is now `decide`, `park`, `find`, `begin` and `settle`.
- A park from tenant approval rules alone (no declared `approval` stage) now needs an `ApprovalBindingStore` bound.
- Who must act before upgrading: today only OS tasks-approvals implements the gate, on unmerged branches
  (`ServiceApprovalGateDriver` and `RecordsApprovalGateDriver`), and OS content, webhooks and workflow-automations plan to
  bind it in their specs. Commerce binds none. Each must port to the new port shape and bind the binding store (the
  Postgres driver in `@stackra/tenancy/node`) before moving to the release that carries this.
