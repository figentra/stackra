/**
 * Stackra file contract:
 * Purpose: `VendorArtifact`, where Android fetches one vendor's SDK: the vendor's Maven repository and the
 *          `group:name:version` coordinate.
 * Boundary: a type only. It points at the vendor's own distribution; no credential goes here (the build machine's
 *           Gradle settings hold one), and this package holds no vendor binary (ADR 0478 decision 4).
 * Runtime: node
 * Governing contract: ADR 0478 (decision 4).
 */

/** Where Android fetches one vendor's SDK. */
export interface VendorArtifact {
  /** The vendor's Maven repository URL; Maven Central needs none. */
  readonly repository?: string;
  /** The `group:name:version` coordinate, when it differs from the package's default. */
  readonly coordinate?: string;
}
