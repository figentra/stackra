---
"@stackra/database": patch
"@stackra/tenancy": patch
---

A column can default to a transaction setting: `.defaultSetting("app.x")` writes
`default nullif(current_setting('app.x', true), '')`, so a writer that names no value stores the call's setting and
rows that predate the column stay null (refused on a `uuid` column for now). `t.belongsToTenant({ expand: true })` uses
it for the expand step of an existing table: a nullable, indexed `tenant_id` filled from `app.tenant_id`, and no
policy, so the table keeps the one it has until the contract step makes the tenant equality its one permissive policy
(ADR 0347 decision 1; tenancy audit 2026-11-07, gap D).
