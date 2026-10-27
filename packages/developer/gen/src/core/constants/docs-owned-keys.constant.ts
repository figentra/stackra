/**
 * Stackra file contract:
 * Purpose: `DOCS_OWNED_KEYS`, the `docs.json` keys gen writes from `DocsConfig`'s typed fields; `DocsConfig.raw` may
 *          not set them (`docs_owned_key`).
 * Boundary: a constant; keep it in step with the fields `emitDocsSite` renders.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 3: a tool's shape minus what Stackra owns); ADR 0002 (2026-10-27 amendment).
 */

/** The keys `raw` cannot set. */
export const DOCS_OWNED_KEYS: ReadonlySet<string> = new Set([
  "$schema",
  "name",
  "description",
  "theme",
  "colors",
  "logo",
  "favicon",
  "navigation",
  "navbar",
  "footer",
]);
