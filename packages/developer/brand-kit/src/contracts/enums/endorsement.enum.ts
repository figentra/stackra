/**
 * Stackra file contract:
 * Purpose: `Endorsement`, how a child kit is endorsed by its parent kit (`parent.endorsement` in `kit.json`).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The codes are the values kit files
 *           already hold; the marks themselves belong to the parent kit and plug in as data, never as code here.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: Figentra's marks and endorsement rules stay in figentra/os/tools/brand-kit).
 */
import { Enum } from "@stackra/contracts";

/**
 * How a child kit is endorsed by its parent kit (`parent.endorsement` in `kit.json`).
 *
 * @example
 * const mark = kit.parent?.endorsement === Endorsement.PoweredBy ? "powered-by" : "by";
 */
export const Endorsement = Enum.of({
  /** "by <parent>". */
  By: "by",
  /** "powered by <parent>". */
  PoweredBy: "powered-by",
});

/** One of the codes above. */
export type Endorsement = Enum.Value<typeof Endorsement>;
