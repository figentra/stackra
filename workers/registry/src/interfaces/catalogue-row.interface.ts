/**
 * Stackra file contract:
 * Purpose: `CatalogueRow`: A catalogue row: a package, its scope's rule and its `latest` version.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** A catalogue row: a package, its scope's rule and its `latest` version. */
export interface CatalogueRow {
  readonly name: string;
  readonly scope: string;
  readonly kind: string;
  readonly modified_at: string;
  readonly read_rule: "open" | "licensed";
  readonly latest: string | null;
  readonly manifest: string | null;
  readonly deprecated: string | null;
}
