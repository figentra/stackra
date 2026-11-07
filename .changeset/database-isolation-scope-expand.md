---
"@stackra/database": patch
---

Migration `database.0006_add_isolation_scope` adds `isolation_scope_id` to `sequence_counters`, `sequence_blocks`,
`sequence_voids` and `projection_rows`: a nullable, indexed public-id column that every insert fills from
`app.tenant_id` (`defaultSetting`), and no policy change. `scope_id` stays the key it was, since a sequence or a
projection row may sit at a node below the isolation's. This is the expand step; a backfill and the contract step
(NOT NULL, equality with the setting as the one permissive policy) follow (tenancy audit 2026-11-07, gap D).
