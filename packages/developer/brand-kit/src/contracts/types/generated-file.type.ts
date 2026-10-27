/**
 * Stackra file contract:
 * Purpose: `GeneratedFile`, one file a generator produced in memory, before it is written or compared by `--check`.
 * Boundary: a type in the leaf entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: deterministic output, generated files never committed).
 */
import type { BrandOutput } from "#contracts/enums/brand-output.enum";

/**
 * One generated file.
 *
 * @example
 * const file: GeneratedFile = { path: "web/manifest.webmanifest", output: BrandOutput.WebManifest, bytes };
 */
export interface GeneratedFile {
  /** Path relative to the output folder, `/`-separated. */
  readonly path: string;

  /** The kind that produced it. */
  readonly output: BrandOutput;

  /** The file's bytes. */
  readonly bytes: Uint8Array;
}
