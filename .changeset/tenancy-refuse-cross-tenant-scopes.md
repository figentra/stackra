---
"@stackra/tenancy": patch
---

`CallIsolationDriver` refuses several granted scopes that span tenants with `tenant_scope_mismatch`. They are one
session, so paths in two tenants (or in a tenant and above every tenant) read both through the ancestor policies.
Several scopes that all resolve alike now follow the single-scope rules of the first: a job or system call takes
their tenant, and a user is held to its own.
