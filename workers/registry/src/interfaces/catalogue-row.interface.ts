/**
 * Stackra file contract:
 * Purpose: `CatalogueRow`: A catalogue row: a package, its scope's rule and its `latest` version.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** A catalogue row: a package, its scope's rule and its `latest` version. */
export interface CatalogueRow {
  /** The full package name, `@scope/name`. */
  readonly name: string;
  /** The scope the package belongs to. */
  readonly scope: string;
  /** The Stackra kind the package declares. */
  readonly kind: string;
  /** When the package last changed, as an ISO 8601 timestamp. */
  readonly modified_at: string;
  /** The read rule of the package's scope. */
  readonly read_rule: "open" | "licensed";
  /** The version the `latest` dist-tag points at, or null. */
  readonly latest: string | null;
  /** The package.json of the latest version as JSON text, or null. */
  readonly manifest: string | null;
  /** The deprecation message of the latest version, or null. */
  readonly deprecated: string | null;
}
