---
"@stackra/tenancy": minor
"@stackra/database": minor
---

Placement (stackra-310). `@stackra/database` adds the `ConnectionResolver` port and `PRIMARY_CONNECTION`
(`./contracts`), the free one-pool `PrimaryConnectionResolverDriver` (`./node`) and `DatabaseConfig.region`, the runway
region key of the deployment. `@stackra/tenancy` adds the placement map: the `Placement` type (a tenant's `region` and
`cell`), the `TenantPlacement` port with `MemoryTenantPlacementDriver`, `tenantOf`, `RegionGuardDriver` (a
`TenancyCheck` that refuses `region_mismatch` with `RegionMismatchError` when a call's tenant is placed in another
region, and fails closed without a placement or a region key) and `TenantPlacementConnectionResolverDriver`, which names
the tenant's cell.
