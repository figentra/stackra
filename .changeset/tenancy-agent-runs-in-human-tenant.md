---
"@stackra/tenancy": patch
---

Agents with no tenant of their own now run in the tenant of the human they act for. An agent actor with no `scopeId`
(such as a background agent acting for its owner) used to run with `app.tenant_id = ''` and see none of its owner's
tenant rows; `TenantIsolationService.withTenant` now sets its human's tenant, and `CallIsolationDriver` checks the scope
and a running transaction's tenant against the same one. What products will see: `@stackra/panel` saved views now show
that agent the human's tenant's views (it saw none before), and `@stackra/access-log` records of that agent's calls now
store in the human's tenant (before, they had no tenant and were not stored). An agent with a tenant of its own keeps
it, one with no tenant anywhere stays a platform call, and every other actor kind keeps its own `scopeId`.
