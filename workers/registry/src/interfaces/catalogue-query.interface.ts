/**
 * Stackra file contract:
 * Purpose: `CatalogueQuery`: A catalogue query.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** A catalogue query. */
export interface CatalogueQuery {
  readonly kind: string | null;
  readonly scope: string | null;
  readonly q: string | null;
  readonly after: { readonly modifiedAt: string; readonly name: string } | null;
  readonly limit: number;
}
