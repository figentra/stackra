/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/tenancy (the `BelongsToTenant` trait and its nullable `BelongsToTenantOrPlatform`, its
 *          `t.belongsToTenant()` macro, `TenantIsolationService` and `CallIsolationDriver`, the `ApprovalBinding` model with its Postgres store driver and the prune job) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reaches Postgres through @stackra/database and
 *           the call's tenant through `node:async_hooks`. The setting name and the tenant storage stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0321 (BelongsToTenant is tenancy's); the STA-347 stand-in barrel
 *                     decision.
 */
export { PruneApprovalBindingsAction } from "#node/actions/prune-approval-bindings.action";
export { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
export { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
export { PostgresApprovalBindingStoreDriver } from "#node/drivers/postgres-approval-binding-store.driver";
export { ApprovalBinding } from "#node/models/approval-binding.model";
export { TenantIsolationService } from "#node/services/tenant-isolation.service";
export { BelongsToTenantOrPlatform } from "#node/traits/belongs-to-tenant-or-platform.trait";
export { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";
