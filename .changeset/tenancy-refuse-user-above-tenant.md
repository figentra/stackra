---
"@stackra/tenancy": patch
---

`CallIsolationDriver` refuses a user actor that claims a tenant but calls in a scope the tree shows above every
tenant (the platform root, a product), with `tenant_scope_mismatch`, before the isolation transaction opens. Such a
call kept its own `app.tenant_id` while its scope paths covered every tenant's ancestor-RLS rows. A platform user (no
`scopeId`) in that scope stays a platform call, and job, system and agent actors keep their rules.
