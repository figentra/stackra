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
  // withScope lives in @stackra/database, which cannot depend on tenancy, so it cannot move into the isolation driver
  "packages/data/database/src/core/functions/run-in-scope.function.ts":
    "withScope for both database drivers: the app.scope_* settings, transaction-local, and the enclosing ones put back after a nested call",
  // the read-and-replay of withScope's settings, shared by onReplica and a requiresNew transaction (STA-2565)
  "packages/data/database/src/core/functions/replay-row-security-settings.function.ts":
    "the withScope settings replayed transaction-locally in a replica's or a requiresNew transaction (STA-2565)",
  // its tenant is a `PLATFORM` partition string and its argument is a scope id, not an actor, so it cannot call
  // `withTenant`, and iam must not depend on tenancy; it sets the tenant transaction-locally in a transaction of its own
  "packages/security/iam/src/node/drivers/postgres-policy-snapshot-store.driver.ts":
    "the snapshot store sets its own tenant transaction-locally in its requiresNew transaction (ADR 0495)",
  // a CLI run with no actor: settings cannot depend on tenancy, and the target node's tenant comes by the nlevel rule
  "packages/state/settings/src/node/functions/open-settings-session.function.ts":
    "the settings:diff and settings:apply runner sets its target node's tenant transaction-locally in its one transaction (ADR 0495; ADR 0239 2026-11-07 amendment)",
});
