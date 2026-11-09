---
"@stackra/database": minor
"@stackra/tenancy": minor
---

An implicit many-to-many pivot of tenant-owned models now stores the call's tenant. MikroORM's pivot insert names only
the two link columns, so `t.belongsToTenant({ pivot: true })` gives a new pivot's `tenant_id` a default read from
`app.tenant_id`, and `t.change(column).defaultSetting(setting)` gives an existing pivot the same default. Outside a
tenant call the default is NULL, so the NOT NULL column refuses the row instead of storing it without a tenant.
