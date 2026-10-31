---
"@stackra/tenancy": minor
---

Add `CallIsolationDriver` to `./node` (STA-1699, ADR 0495): the `CallIsolation` of the action pipeline and of every
background unit, which sets the scope and the tenant settings transaction-locally in one transaction, read-only for a
query. Add `asTenant(tenantId, work)` to `./testing`, which runs the real isolation on the current database, and the
`test:int` tier with real-Postgres isolation tests under a role without `BYPASSRLS`.
