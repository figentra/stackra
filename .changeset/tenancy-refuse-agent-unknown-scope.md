---
"@stackra/tenancy": patch
---

`CallIsolationDriver` refuses an agent actor with a tenant (its own `scopeId`, or else that of the human it acts for)
whose scope the tree does not show at that path, whose granted scopes are all unknown, or whose scope sits above every
tenant (`tenant_scope_mismatch`), before any transaction or setting, the same as a tenant user. It used to run such a
call in the agent's own tenant. An agent that carries only its human's tenant is now also refused in another tenant's
scope. An agent with no tenant (acting for a platform user) stays a platform call; service actors are unchanged.
