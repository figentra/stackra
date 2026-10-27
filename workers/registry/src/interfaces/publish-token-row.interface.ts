/**
 * Stackra file contract:
 * Purpose: `PublishTokenRow`: A `publish_tokens` row.
 * Boundary: types only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `publish_tokens` row. */
export interface PublishTokenRow {
  readonly hash: string;
  readonly name: string;
  readonly repository: string;
  readonly run: string;
  readonly expires_at: string;
}
