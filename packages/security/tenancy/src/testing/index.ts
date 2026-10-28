/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/tenancy (a fresh tenant id, a tenant actor, a tenant
 *          call without a database, and the tenant options of the row-security check) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `./node` internals only; no other package's `./testing`
 *           (ADR 0269 decision 3). Only vitest loads it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { fakeTenantId } from "#testing/functions/fake-tenant-id.function";
export { runAsTenant } from "#testing/functions/run-as-tenant.function";
export { tenantActor } from "#testing/functions/tenant-actor.function";
export { tenantIsolationOptions } from "#testing/functions/tenant-isolation-options.function";
