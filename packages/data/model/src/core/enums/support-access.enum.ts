/**
 * Stackra file contract:
 * Purpose: `SupportAccess`, whether the fields of a data class are shown under support access.
 * Boundary: an `Enum.of` value plus the type of the same name; one of the four effects a data class sets. The reader
 *           of the effect applies it; no product checks a class by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 2 and 4).
 */
import { Enum } from "@stackra/contracts";

/** What support access sees of a class's fields. */
export const SupportAccess = Enum.of({
  /** Hidden from a support engineer. */
  Hidden: "hidden",
  /** Visible under support access. */
  Visible: "visible",
});

/** One of the codes above. */
export type SupportAccess = Enum.Value<typeof SupportAccess>;
