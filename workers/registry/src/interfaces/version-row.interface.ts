/**
 * Stackra file contract:
 * Purpose: `VersionRow`: A `versions` row.
 * Boundary: types only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `versions` row. */
export interface VersionRow {
  readonly name: string;
  readonly version: string;
  readonly kind: string;
  readonly manifest: string;
  readonly integrity: string;
  readonly shasum: string;
  readonly sha256: string;
  readonly signatures: string;
  readonly predicate_type: string;
  readonly size: number;
  readonly publisher_run: string;
  readonly published_at: string;
  readonly deprecated: string | null;
}
