---
"@stackra/tenancy": patch
---

`CallIsolationDriver` refuses a user with a tenant whose scope the scope tree does not show at that path
(`tenant_scope_mismatch`), also when several granted scopes are all unknown. It used to run such a call in the user's own
tenant, so a forged reference above the tenant (its own id with the path `platform`) set `app.scope_paths` over more
than the tenant. A platform user (no `scopeId`) stays a platform call; job and system actors keep their
`tenant_scope_unresolved` refusal. `asTenant` now shows each scope option in its tree as the tenant's own node or a
branch under it, so a scoped `asTenant` call keeps running.
