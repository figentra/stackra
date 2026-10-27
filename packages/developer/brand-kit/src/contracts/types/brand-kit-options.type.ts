/**
 * Stackra file contract:
 * Purpose: `BrandKitOptions`, the config keys of one generator run (CLI flags and Runway step input), with their value
 *          types.
 * Boundary: a type in the leaf entry. Defaults are stated in the doc comments and applied by the generator.
 * Runtime: isomorphic
 * Governing contract: ADR 0044 and ADR 0146 (config keys); ADR 0441 (as amended).
 */
import type { BrandOutput } from "#contracts/enums/brand-output.enum";

/**
 * The config keys of one generator run, from CLI flags or a Runway step's input.
 *
 * @example
 * const options: BrandKitOptions = { root: ".", check: true };
 */
export interface BrandKitOptions {
  /** Repository root. Default: the current directory. */
  readonly root?: string;

  /** Kit folder, relative to `root`. Default: `assets/brand`. */
  readonly kitDir?: string;

  /** Output folder, relative to `root`; never committed. Default: `.stackra/brand`. */
  readonly outDir?: string;

  /** Kinds to write. Default: every `BrandOutput`. */
  readonly outputs?: readonly BrandOutput[];

  /** Check only: write nothing, compare against a fresh deterministic build and run the kit file checklist. */
  readonly check?: boolean;

  /** Folder of the parent kit's endorsement data (marks and rules), plugged in as data. */
  readonly parentKitDir?: string;
}
