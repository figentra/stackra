---
"@stackra/tenancy": patch
---

A nested `TenantIsolationService.withTenant` flushes its own writes before it puts the enclosing tenant back. The ORM
writes a savepoint's pending changes only after its callback returns, so they used to be checked by row security and
read `app.tenant_id` as the enclosing tenant, which refused or misplaced a row the nested call created.
