---
"@stackra/database": minor
"@stackra/cli": minor
---

System workers and pre-tenant routes can now find tenant rows before they know the tenant, through one narrow,
audited way in (ADR 0239 amendment, gap A).

A migration gives a tenant table `t.systemAccess({ select, update, reason })`. This lets the new
`stackra_system_access` role read the `select` columns and write the `update` columns, and nothing else. The role
cannot log in, does not bypass row-level security, and no one is a member of it, so no session can become it. The
package then writes its lookup or claim with `schema.systemFunction({ name, args, returns, sql, reason })`. The
function runs as that role with a fixed search path, returns only the columns it declares (ids and the tenant id),
and only the service may call it. The worker then loads each row in that row's tenant.

`assertRowSecurity`, and so every service's generated isolation test, refuses anything looser: a policy for anyone
but the role, a member of the role, a role that bypasses row-level security, a grant beyond the declared columns, or
a function that is not `SECURITY DEFINER`, does not pin its search path, or that anyone may call.
`stackra row-security-declarations` lists both declarations with their reasons for review.

Deployment: the database user that runs migrations needs `CREATEROLE` the first time a migration uses either
declaration. A managed Postgres master user (RDS) has it; RUNWAY's deploy role must have it too.
