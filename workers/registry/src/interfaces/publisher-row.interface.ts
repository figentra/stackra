/**
 * Stackra file contract:
 * Purpose: `PublisherRow`: A `publishers` row: the trusted publisher of a scope.
 * Boundary: types only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `publishers` row: the trusted publisher of a scope. */
export interface PublisherRow {
  readonly scope: string;
  readonly repository: string;
  readonly repository_id: string;
  readonly repository_owner_id: string;
  readonly workflow: string;
  readonly ref: string;
  readonly environment: string;
}
