---
"@stackra/gen": patch
---

`model_tenancy_missing` now checks packages too (tenancy audit 2026-11-07; ADR 0210 amendment). A package model that
is neither `BelongsToTenant`/`BelongsToTenantOrPlatform` nor `Model.global(...)` prints a warning in 0.19 and will be
refused from 0.20. A table an ADR names is skipped (today `achievements.award_verifications`, ADR 0368 decision 5).
The new staged check `model_tenancy_migration_missing` warns when an owned model's table is created or altered by the
member's migrations but none of them calls `t.belongsToTenant()`; it refuses under `STACKRA_GEN_STRICT=1` and from
0.20.
