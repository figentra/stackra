/**
 * Stackra file contract:
 * Purpose: `CatalogueQuery`: A catalogue query.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** A catalogue query. */
export interface CatalogueQuery {
  /** Only packages of this Stackra kind, or null for every kind. */
  readonly kind: string | null;
  /** Only packages of this scope, or null for every scope. */
  readonly scope: string | null;
  /** Free text the package name or the latest description must contain, or null for no text filter. */
  readonly q: string | null;
  /** The last row of the previous page, or null for the first page. */
  readonly after: { readonly modifiedAt: string; readonly name: string } | null;
  /** The page size the caller asked for; the store reads one row more to tell whether a next page exists. */
  readonly limit: number;
}
