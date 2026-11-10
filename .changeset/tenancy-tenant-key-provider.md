---
"@stackra/contracts": minor
"@stackra/tenancy": minor
---

Tenancy ships the per-tenant `KeyProvider` (ADR 0188 decision 2, amendment 2026-11-09). `TenantKeysConfig` (`tenancy.tenant_keys`) picks the driver: `ephemeral` (the default, random keys per tenant in memory, for dev and tests) or `kms`, which keeps each tenant's data keys wrapped by a regional AWS KMS key under the encryption context of tenant and key id, mints `k1` on a tenant's first seal, rotates to `k<n+1>` and never retires an old key, so data sealed earlier still opens. The wrapped keys live behind the new `TenantDataKeyStore` port: `memory`, or `postgres` in the append-only, tenant-owned `tenancy.tenant_data_keys` (row-level security on `tenant_id`), and each mint records `TenantDataKeyMinted`. Both drivers refuse a platform call: a tenant data key needs `withTenant`. Unwrapped keys are cached per tenant (`cacheSeconds`, `cacheTenants`). Contracts gives `KeyProvider` its driver key and exports `kmsKeyContext`.
