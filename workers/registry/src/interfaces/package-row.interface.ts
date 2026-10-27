/**
 * Stackra file contract:
 * Purpose: `PackageRow`: A `packages` row.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `packages` row. */
export interface PackageRow {
  /** The full package name, `@scope/name`. */
  readonly name: string;
  /** The scope the package belongs to. */
  readonly scope: string;
  /** The Stackra kind the package declared at its first publish. */
  readonly kind: string;
  /** When the package was first published, as an ISO 8601 timestamp. */
  readonly created_at: string;
  /** When the package last changed, as an ISO 8601 timestamp. */
  readonly modified_at: string;
}
