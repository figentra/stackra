/**
 * Stackra file contract:
 * Purpose: `PULL_REQUEST_PREVIEW_SETTINGS`, the data of a per-pull-request preview: the surface it serves and how long
 *          its KV rows live. The zone its one host lives in is the product's own
 *          (`environments.preview.domains.pullRequestZone` in its root runway), never a default.
 * Boundary: data only; `publishProduct` and `pullRequestPreviewHost` read it.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 7 and the 2026-11-01 and 2026-11-09 notes): `<product>-pr-<n>.<zone>`, the console
 *                     at `/`, 7 days; ADR 0170 (decision 7); STA-2876 (the zone is the product's).
 */

/** Per-pull-request preview defaults. */
export const PULL_REQUEST_PREVIEW_SETTINGS = Object.freeze({
  /** The one surface a preview serves, at `/`; the API is the router's `/api/*`. */
  surface: "console",
  /** Rows expire 7 days after the last publish, so a preview nobody pushes to cleans itself up. */
  ttlSeconds: 7 * 24 * 60 * 60,
} as const);
