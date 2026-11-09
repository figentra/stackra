---
"@stackra/settings": patch
"@stackra/cli": patch
---

`StoredSetting` and `StoredSettingRevision` are owned: both take `BelongsToTenantOrPlatform`, so a row's `tenant_id` is the running `withTenant` call's tenant, or NULL in a platform call. `@stackra/settings` now depends on `@stackra/tenancy`. The `settings:diff` and `settings:apply` runner writes through `TenantIsolationService.withTenant` as a system actor inside its `withScope` transaction, at a tenant node as that tenant and at the root or a product node as the platform, and no longer sets `app.tenant_id` itself. `@stackra/cli` drops the runner from `SESSION_SETTING_ALLOWED`.
