/**
 * Stackra file contract:
 * Purpose: `LocatedKit`, a kit found on disk: its parsed configuration and the folder it sits in.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 4: a product's kit is `<repo>/assets/brand`).
 */
import type { BrandKit } from "#contracts/types/brand-kit.type";

/** A kit and its folder. */
export interface LocatedKit {
  /** The parsed kit. */
  readonly kit: BrandKit;

  /** The absolute folder that holds `kit.json`. */
  readonly dir: string;
}
