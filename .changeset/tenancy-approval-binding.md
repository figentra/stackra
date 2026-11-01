---
"@stackra/tenancy": minor
---

Add the approval binding store for the approval stage (STA-1724, ADR 0509): the `ApprovalBinding` model and its first
migration (`tenancy.approval_bindings`, `BelongsToTenant` with the forced tenant policy, insert-only with UPDATE revoked),
`PostgresApprovalBindingStoreDriver` (insert, read by approval id, prune; no update) behind `@stackra/actions`'
`ApprovalBindingStore` port, and `PruneApprovalBindingsAction`, the daily job that deletes a binding 24 hours plus 400 days
after its `expiresAt`. The prune takes and returns plain types, so tenancy gains no dependency.
