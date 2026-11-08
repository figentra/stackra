---
"@stackra/database": minor
"@stackra/gen": minor
"@stackra/cli": minor
---

The row-security audit learns the group (c) decisions (ADR 0239 amendment).

`assertRowSecurity` now accepts a table that keeps its tenant in `scope_id`, when its one permissive policy is exactly
the `equals` or `equalsOrUnset` policy `t.rowLevelSecurity` writes on the tenant setting. It then checks that table
like any owned one, with the two-tenant probe on `scope_id`. A looser policy, such as one that adds `or true`, or a
second permissive policy, is still refused. Core payments' three tables pass this way, with no migration.

Migrations gain two declarations, each with a required one-line reason:

- `t.platformTable(reason)`: no row of this table can ever belong to a tenant. Compiling refuses it on a table that
  also writes a scope id, an isolation scope id, a column filled from a setting, or a policy. The audit refuses it once
  the table holds the tenant column, a scope id or an isolation scope id.
- `t.reviewedPolicy(reason, policies)`: the table's policies have a reviewed shape the audit cannot derive. The audit
  still requires row-level security enabled and forced, and every named policy present. Only the tenant-policy checks
  and the probe are left out.

The compiled migration carries each declaration as a comment line. Gen's generated isolation test now passes its
migrations folder to the audit (`migrationsDirectory`), which reads them.

`PLATFORM_TABLES` gains the platform-list tables: `outbox.inbox`, `outbox.change_cursors`, `queue.job_batches`,
`scheduler.watermarks`, `workflow.service_ack_sets`, `rules.condition_fields`, `database.seed_records` and
`scope.scope_nodes`, each with its reason.

New command `stackra row-security-declarations` lists every declaration with its reason. It and
`stackra validate --repository` fail on a declaration that is not in the reviewed list
`tools/scripts/row-security-declarations.yaml` with that reason.
