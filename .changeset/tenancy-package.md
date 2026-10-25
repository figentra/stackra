---
"@stackra/tenancy": minor
---

Add `@stackra/tenancy`: tenant isolation in Postgres (`BelongsToTenant`, the `t.belongsToTenant()` macro with its
equality policy on `tenant_id`, and `TenantIsolationService.withTenant` in `./node`), the tenant level as scope data
with the tenancy step of the resolver chain, the scheduler's per-tenant `TenancyCronScopesDriver`, and the client's `TenantSwitcher` with `useTenant` and `useTenantSwitcher`.
