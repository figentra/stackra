/**
 * Stackra file contract:
 * Purpose: `SESSION_SETTING_ALLOWED`, the paths allowed to write an `app.*` setting, each with why (moved from
 *          `ALLOWED` of `tools/scripts/session-settings.mjs`). A new entry needs the same and an ADR 0495 reading.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 3); ADR 0239 (decision 1); STA-1699.
 */

/** Repository path to the reason it may write an `app.*` setting. */
export const SESSION_SETTING_ALLOWED: Readonly<Record<string, string>> = Object.freeze({
  "packages/security/tenancy/src/node/drivers/call-isolation.driver.ts":
    "the isolation driver: scope and tenant settings, transaction-local, in one transaction (ADR 0495 decision 1)",
  "packages/security/tenancy/src/node/services/tenant-isolation.service.ts":
    "withTenant: the one place app.tenant_id is written, transaction-local (ADR 0239 decision 1)",
  "packages/data/database/src/node/drivers/postgres-database.driver.ts":
    "withScope and onReplica: the app.scope_* settings and their replay on a replica, transaction-local",
  "packages/data/database/src/testing/drivers/memory-database.driver.ts":
    "the in-memory twin of withScope, which records the same settings",
  // its tenant is a `PLATFORM` partition string and its argument is a scope id, not an actor, so it cannot call
  // `withTenant`, and iam must not depend on tenancy; it sets the tenant transaction-locally in a transaction of its own
  "packages/security/iam/src/node/drivers/postgres-policy-snapshot-store.driver.ts":
    "the snapshot store sets its own tenant transaction-locally in its requiresNew transaction (ADR 0495)",
});
