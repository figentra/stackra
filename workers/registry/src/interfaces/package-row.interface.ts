/**
 * Stackra file contract:
 * Purpose: `PackageRow`: A `packages` row.
 * Boundary: types only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `packages` row. */
export interface PackageRow {
  readonly name: string;
  readonly scope: string;
  readonly kind: string;
  readonly created_at: string;
  readonly modified_at: string;
}
