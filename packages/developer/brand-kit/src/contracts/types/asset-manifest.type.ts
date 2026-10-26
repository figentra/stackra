/**
 * Stackra file contract:
 * Purpose: `AssetManifest`, the list of every file one run generated, read by the never-committed check (stackra-13).
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import type { AssetManifestEntry } from "#contracts/types/asset-manifest-entry.type";

/**
 * Every generated file of one kit.
 *
 * @example
 * const paths = manifest.files.map((file) => file.path);
 */
export interface AssetManifest {
  /** The kit id. */
  readonly kit: string;

  /** Hex SHA-256 of the kit inputs the run read. */
  readonly inputHash: string;

  /** Generated files, sorted by `path`. */
  readonly files: readonly AssetManifestEntry[];
}
