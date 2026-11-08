---
"@stackra/tenancy": minor
"@stackra/app": patch
---

Calls from branch users now work, directly and through a service or an agent. A user's token is often issued for a
branch, so the user's `scopeId` is the branch's id, not the tenant's. `CallIsolationDriver` used to compare those ids
as they were, so a branch user was refused in its own tenant, and so was a service or an agent of the tenant acting
for that user. It now reads every scope a user, an agent or a service claims through the scope tree and compares
tenants: a branch counts as the tenant above it, and the call runs with that tenant set, never the branch id. A user
from another tenant's branch is still refused, and so is a claimed scope the tree does not show or one above every
tenant (`tenant_scope_mismatch`). A tree read that fails fails the call; it never lets the call through.

`CallAuthenticator` no longer compares the service's and the user's scope ids itself, since it cannot see the tree;
`CallIsolationDriver` now owns that rule.
