/**
 * Stackra file contract:
 * Purpose: `BrandStepRun`, one brand-kit run the brand step made: the surface or app, the scope for a white-label run,
 *          the output folder and the `BrandOutput` codes it built.
 * Boundary: type only; `runBrandStep` returns them and `committedBrandOutputs` reads each one's asset manifest.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D17).
 */

/** One brand-kit run. */
export type BrandStepRun = {
  /** The web surface key or the mobile app key. */
  readonly surface: string;
  /** The scope id, for a white-label run. */
  readonly scope?: string;
  /** The output folder, relative to the repository. */
  readonly outDir: string;
  /** The `BrandOutput` codes built. */
  readonly outputs: readonly string[];
};
