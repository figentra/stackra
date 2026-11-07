---
"@stackra/tenancy": patch
---

`TenantIsolationService.withTenant` runs an agent actor with no `scopeId` of its own in the tenant of the human it acts
for (`onBehalfOf`), so a background agent acting for its owner reads and writes its owner's tenant rows. It used to run
with `app.tenant_id = ''` and see no tenant row. `CallIsolationDriver` compares a running transaction's tenant with the
same tenant. An agent with a tenant of its own keeps it, one with no tenant anywhere stays a platform call, and every
other actor kind keeps its own `scopeId`.
