---
"@stackra/settings": minor
"@stackra/cli": patch
---

The settings tables are tenant-owned in the platform form (migration `settings.0004_contract_settings_tenancy`):
`stored_settings` and `stored_setting_revisions` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a
NULL row is the platform's), forced row-level security and the platform policies. The migration backfills a row at a
tenant node (`nlevel(scope_path) = 3`) from its scope and keeps a row at the root or a product node as a platform row.
A user's row is now keyed `(tenant_id, group_key, user_id)` (NULLs not distinct), and every user lookup names the
session's own owner. New system function `settings.claim_due_revisions` (no runtime caller yet).

The `settings:diff` and `settings:apply` runner (`openSettingsSession`) now sets `app.tenant_id` by the same rule: a
tenant node is its own owner, the root and a product node are the platform's, and a node below a tenant node is refused
(the runner cannot read its tenant without the scope tree yet). `@stackra/cli`'s session-settings check allows that one
write.

Upgrade: the migration refuses, changing nothing, while a setting or revision sits below a tenant node or belongs to a
user (a user row names no scope, so its tenant cannot be read, and as a platform row every tenant could read it).
Record those values, delete the rows (`nlevel(scope_path) > 3`, or `user_id is not null`) from both tables, migrate,
then write the values again from a session in each node's or user's tenant.
