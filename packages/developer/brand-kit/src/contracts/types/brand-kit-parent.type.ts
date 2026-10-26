/**
 * Stackra file contract:
 * Purpose: `BrandKitParent`, the parent kit a child kit builds on and how it is endorsed.
 * Boundary: a type in the leaf entry. The parent kit itself (for Figentra, figentra/os/tools/brand-kit) is data the
 *           generator is given; the package never imports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import type { Endorsement } from "#contracts/enums/endorsement.enum";

/**
 * The parent of a child kit.
 *
 * @example
 * const parent: BrandKitParent = { kit: "parent", version: "2.0.0", endorsement: Endorsement.By };
 */
export interface BrandKitParent {
  /** The parent kit's id. */
  readonly kit: string;

  /** The parent kit version the child is built against (semver). */
  readonly version: string;

  /** The endorsement line, when the child shows one. */
  readonly endorsement?: Endorsement;
}
