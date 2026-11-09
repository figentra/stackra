/**
 * Stackra file contract:
 * Purpose: `WRANGLER_OPERATIONAL_BASELINE`, the hand-written `wrangler.jsonc` files that still hold operational keys.
 * Boundary: data only. A ratchet: drop a file when its Worker deploys through the `cloudflare-workers` provider (which
 *           renders those keys); never add one.
 * Runtime: node
 * Governing contract: ADR 0519 (decision 1, Enforcement); ADR 0284 decision 8 as narrowed; STA-1989.
 */

/** The files that held operational keys when the check landed (STA-1989). */
export const WRANGLER_OPERATIONAL_BASELINE: ReadonlySet<string> = new Set([
  "workers/edge/wrangler.jsonc",
  "workers/registry/wrangler.jsonc",
  "workers/static/wrangler.jsonc",
  "workers/turbo-cache/wrangler.jsonc",
]);
