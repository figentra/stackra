/**
 * Stackra file contract:
 * Purpose: `VersionRow`: A `versions` row.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `versions` row. */
export interface VersionRow {
  /** The full package name, `@scope/name`. */
  readonly name: string;
  /** The semver version string. */
  readonly version: string;
  /** The Stackra kind the version declares. */
  readonly kind: string;
  /** The version's package.json as JSON text. */
  readonly manifest: string;
  /** The SHA-512 subresource integrity string of the tarball. */
  readonly integrity: string;
  /** The SHA-1 hex of the tarball, which older npm clients check. */
  readonly shasum: string;
  /** The SHA-256 hex of the tarball. */
  readonly sha256: string;
  /** The registry signatures of the version as JSON text. */
  readonly signatures: string;
  /** The predicate type of the version's provenance attestation. */
  readonly predicate_type: string;
  /** The tarball's size in bytes. */
  readonly size: number;
  /** The GitHub Actions run URL that published the version. */
  readonly publisher_run: string;
  /** When the version was published, as an ISO 8601 timestamp. */
  readonly published_at: string;
  /** The deprecation message, or null when the version is not deprecated. */
  readonly deprecated: string | null;
}
