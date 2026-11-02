/**
 * Stackra file contract:
 * Purpose: `WRANGLER_OPERATIONAL_KEYS`, the wrangler keys that are operational settings, which `runway.yaml` owns
 *          (ADR 0519 decision 1).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0519 (decision 1, Enforcement); ADR 0284 decision 8 as narrowed; STA-1989.
 */

/** The operational keys, in wrangler's names. A code fact (`name`, `main`, `assets`, bindings, `triggers`) is not here. */
export const WRANGLER_OPERATIONAL_KEYS: readonly string[] = Object.freeze([
  "account_id",
  "compatibility_date",
  "compatibility_flags",
  "workers_dev",
  "preview_urls",
  "previews",
  "route",
  "routes",
  "observability",
  "limits",
  "placement",
  "cache",
  "logpush",
  "tail_consumers",
  "upload_source_maps",
  "keep_vars",
]);
