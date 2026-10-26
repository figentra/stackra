---
"@stackra/tenancy": minor
---

Add `BelongsToTenantOrPlatform` and `t.belongsToTenant({ nullable: true })` (a `NULL` tenant is the platform's, under an
`equalsOrUnset` policy), `TenantTokenService` over the `TenantTokens` port (opaque `ttk_` tokens stored by SHA-256,
resolved per purpose, for anonymous calls such as iCal feeds), the `TenantBillingContacts` port with its memory driver,
and a new `./testing` entry with `fakeTenantId`, `tenantActor` and `runAsTenant`.
