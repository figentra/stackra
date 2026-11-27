/**
 * Stackra file contract:
 * Purpose: `ACTION_STORE_PORTS`, each `config.actions.stores` field `checkActionStores` checks, keyed to the manifest
 *          driver key of the port it selects (`actions.IdempotencyStore`, `actions.RateLimitStore`).
 * Boundary: internal. The names restate @stackra/actions' `StoresConfig` (runway does not import it).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement); ADR 0136 (decision 3); ADR 0217 (decision 2); STA-2798.
 */

/** A `config.actions.stores` field to the manifest key of the port it selects. */
export const ACTION_STORE_PORTS = Object.freeze({
  idempotency: "actions.IdempotencyStore",
  rateLimit: "actions.RateLimitStore",
} as const);
