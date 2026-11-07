---
"@stackra/database": patch
"@stackra/gen": patch
---

`assertRowSecurity` now audits every table, not only those holding the owner column: a table without it fails unless
`PLATFORM_TABLES` (the migration ledger, the action store, cache and lock tables) or the new `platform` option names it
with a reason. An owned table must have exactly one permissive policy, `pol_<table>_<column>`, the `FOR ALL` owner
equality, and only restrictive policies named after their column beside it (ADR 0347 decision 5). The probe seeds a
row of each owner itself, so the cross-owner read always runs, and also checks that an unset setting sees no row and
the owner sees its own. gen's generated tenant-isolation test passes the service's `Model.global` tables and
`MODEL_SCOPE_EXEMPTIONS` as `platform`. A table under a scope-path policy with no `tenant_id` now fails the audit.
