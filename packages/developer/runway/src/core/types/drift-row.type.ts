/**
 * Stackra file contract:
 * Purpose: `DriftRow`, one setting that differs between the rendered config and what Cloudflare reports.
 * Boundary: plain data.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 7); STA-1992.
 */

/** One setting whose rendered value differs from what Cloudflare reports. */
export type DriftRow = {
  /** The wrangler key, dotted (`observability.logs.enabled`). */
  readonly key: string;
  /** What runway.yaml renders. */
  readonly rendered: string;
  /** What Cloudflare reports, `<unset>` when it reports nothing. */
  readonly live: string;
};
