---
"@stackra/database": minor
"@stackra/gen": minor
---

The tenancy contract step's two checks are now errors (ADR 0239):

- `assertRowSecurity`: a table without the owner column that no platform list names is a gap, by default. It no longer
  reads `STACKRA_GEN_STRICT`; only the audit's own tests pass `strict: false` to read such tables back as warnings with
  their group. A service's generated isolation test therefore fails on one.
- gen's `model_tenancy_missing` (and `model_tenancy_migration_missing`) are errors for a package's models, as they
  already were for a service running `@stackra/tenancy`.

Before taking this version, a product must have zero such tables and models: list a table that holds no tenant data
with `t.platformTable(reason)` (or `t.reviewedPolicy(reason, policies)`), give a tenant table its owner column, and
mark each model `BelongsToTenant`, `BelongsToTenantOrPlatform` or `Model.global`. Core itself has none.
