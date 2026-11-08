---
"@stackra/database": minor
---

The contract step of the sequence and projection tables. Migration `database.0007_contract_isolation_scope` makes
`isolation_scope_id` NOT NULL on `sequence_counters`, `sequence_blocks`, `sequence_voids` and `projection_rows`, makes
`pol_<table>_isolation_scope_id` (equality with `app.tenant_id`) each table's one permissive policy, and keeps the scope
path only as a restrictive policy. `scope_id` stays the caller's sub-scope. The migration first counts the rows with no
`isolation_scope_id` and refuses before changing anything if there are any, naming each table's count: an environment
with such rows from the expand step runs the backfill (RUNWAY 4c) first. After this step a sequence or projection is
written only inside a tenant call.

New migration API for a contract step: `schema.refuseNulls(column, tables, remedy)` (the pre-flight),
`t.dropRowLevelSecurity(column, options)` (drops a policy an earlier migration created, by the name it was created
under), `restrictive: true` on `t.rowLevelSecurity` (an `AS RESTRICTIVE` policy that does not narrow a session with the
setting unset), and a policy on a column an earlier migration wrote. `assertRowSecurity` audits these four tables by
`isolation_scope_id` (group (b), by name), with every check and probe of a tenant table.
