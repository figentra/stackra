---
"@stackra/tenancy": patch
---

`CallIsolationDriver` takes the `ScopeTree` and resolves `app.tenant_id` from the call's scope for `job` and `system`
actors (STA-1823, ADR 0495 note of 2026-11-01): the tenant is `tenantOf(tree, scope)`, a branch resolves to its parent
tenant, and a scope the tree does not show is refused with the new `TenantScopeUnresolvedError`
(`tenant_scope_unresolved`) instead of running with an empty tenant. Any other actor keeps its own `scopeId` and a scope
of another tenant is refused with the new `TenantScopeMismatchError` (`tenant_scope_mismatch`). The constructor gains a
third `ScopeTree` argument; `asTenant` supplies an empty tree and runs a platform call as a staff user.
