/**
 * Stackra file contract:
 * Purpose: `PULL_REQUEST_PREVIEW_SETTINGS`, the data of a per-pull-request preview: the zone its one host lives in,
 *          the surface it serves, and how long its KV rows live.
 * Boundary: data only; `publishProduct` and `pullRequestPreviewHost` read it.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 7 and the 2026-11-01 and 2026-11-09 notes): `<product>-pr-<n>.figentra.cloud`, the console
 *                     at `/`, 7 days; ADR 0170 (decision 7).
 */

/** Per-pull-request preview defaults. */
export const PULL_REQUEST_PREVIEW_SETTINGS = Object.freeze({
  /** A separate registrable domain from production, so preview cookies and storage stay apart. */
  zone: "figentra.cloud",
  /** The one surface a preview serves, at `/`; the API is the router's `/api/*`. */
  surface: "console",
  /** Rows expire 7 days after the last publish, so a preview nobody pushes to cleans itself up. */
  ttlSeconds: 7 * 24 * 60 * 60,
} as const);
