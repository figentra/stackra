/**
 * Stackra file contract:
 * Purpose: `PublishTokenRow`: A `publish_tokens` row.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `publish_tokens` row. */
export interface PublishTokenRow {
  /** The SHA-256 hex of the publish token; the token itself is never stored. */
  readonly hash: string;
  /** The one package name the token may publish. */
  readonly name: string;
  /** The `owner/repo` of the trusted publisher the token was issued to. */
  readonly repository: string;
  /** The GitHub Actions run URL that exchanged for the token. */
  readonly run: string;
  /** When the token stops working, as an ISO 8601 timestamp. */
  readonly expires_at: string;
}
