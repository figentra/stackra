/**
 * Stackra file contract:
 * Purpose: `AssetManifestEntry`, one generated file in the asset manifest.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: generated files never committed).
 */
import type { BrandOutput } from "#contracts/enums/brand-output.enum";

/**
 * One generated file.
 *
 * @example
 * const entry: AssetManifestEntry = { path: "icons/icon-1024.png", output: BrandOutput.AppIcon, sha256: "…", bytes: 1 };
 */
export interface AssetManifestEntry {
  /** Path relative to the output folder, `/`-separated. */
  readonly path: string;

  /** The kind that produced it. */
  readonly output: BrandOutput;

  /** Hex SHA-256 of the file's bytes. */
  readonly sha256: string;

  /** Size in bytes. */
  readonly bytes: number;
}
