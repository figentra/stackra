/**
 * Stackra file contract:
 * Purpose: `FloorBound`, which side of a legal floor a value may not cross: a minimum (a withdrawal period, a retention
 *          period), a maximum (a deposit cap, a reporting window) or a list floor (refused goods: a value may add
 *          items to the list but never drop one).
 * Boundary: an `Enum.of` value plus the type of the same name. The settings resolver and the rules engine apply it; this
 *           package only carries it with the value and the law that set it.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0363 (decision 4: legal floors are pack data); ADR 0294 (decision 16);
 *                     ADR 0455 (decision 2: the list floor).
 */
import { Enum } from "@stackra/contracts";

/** The side of a floor. */
export const FloorBound = Enum.of({
  /** No setting may go below the value. */
  Min: "min",
  /** No setting may go above the value. */
  Max: "max",
  /** The value is a list that keeps every item of the floor's list; items may be added, never dropped. */
  List: "list",
});

/** One of the codes above. */
export type FloorBound = Enum.Value<typeof FloorBound>;
