/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/entitlements (the `EntitlementUsage` port) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `EntitlementSource` stays in `.`: its signature uses `EntitlementClass`, which names the
 *           core `Entitlement` base, and contracts cannot import core.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { EntitlementUsage } from "#contracts/ports/entitlement-usage.port";
