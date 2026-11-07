---
"@stackra/tenancy": patch
---

`TenantIsolationService.withTenant` puts the enclosing tenant back when it runs inside a running transaction. A
released savepoint keeps a `set_config(…, true)` until the outer transaction ends, so a nested call used to leave
`app.tenant_id` on the inner tenant for the rest of the caller's transaction while `ACTIVE_TENANT` had reverted.
