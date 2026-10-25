/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/tenancy (the client's `TenantSwitcher`, the tenant level as
 *          scope data, the tenancy step of the resolver chain, the scheduler's per-tenant `CronScopes` driver, the
 *          tenant id check and the refusals) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: nothing here touches a database, a DOM or a Node
 *           API. `TenantMembership` is declared in this folder but exported from `./react` only (one symbol, one
 *           entry, ADR 0294 d15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decisions 7 and 8); the STA-347 stand-in barrel decision.
 */
export { TENANT_SCOPE_ALIAS } from "#core/constants/tenant-scope-alias.constant";
export { TENANT_SCOPE_LEVEL } from "#core/constants/tenant-scope-level.constant";
export { TenancyCronScopesDriver } from "#core/drivers/tenancy-cron-scopes.driver";
export { TenantScopeResolverDriver } from "#core/drivers/tenant-scope-resolver.driver";
export { TenancyScopes } from "#core/enums/tenancy-scopes.enum";
export { TenantMembershipMissingError } from "#core/errors/tenant-membership-missing.error";
export { TenantRequiredError } from "#core/errors/tenant-required.error";
export { isTenantId } from "#core/functions/is-tenant-id.function";
export { TenantSwitcher } from "#core/services/tenant-switcher.service";
