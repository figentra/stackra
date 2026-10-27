/**
 * Stackra file contract:
 * Purpose: `Rounding`, the one rounding vocabulary: how `Money#times` and `Money#divide` turn an exact quotient into
 *          whole minor units, and (the `down`, `up` and `half_up` subset, `@stackra/support`'s `QuantityRounding`) how
 *          `Quantity.roundTo` and `Quantity.priceMinor` round.
 * Boundary: an `Enum.of` value plus the type of the same name. Directions are relative to zero, so a negative amount
 *           rounds like its positive mirror. `HalfEven` is the default; `HalfUp` is for a tax rule that requires it;
 *           `Down` never advertises a rounded-up price. One home here, below both money and support.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: half-even by default, half-up where a tax rule requires it); ADR 0294
 *                     (decision 16: Enum); ADR 0231 (snake_case codes); STA-1383 (one rounding vocabulary).
 */
import { Enum } from "#core/bases/enum.base";

/** The rounding modes of money arithmetic. */
export const Rounding = Enum.of({
  /** Toward zero: drop the remainder (12.9 → 12, -12.9 → -12). */
  Down: "down",
  /** Away from zero whenever there is a remainder (12.1 → 13, -12.1 → -13). */
  Up: "up",
  /** To the nearest; an exact half away from zero (12.5 → 13, -12.5 → -13). */
  HalfUp: "half_up",
  /** To the nearest; an exact half to the even neighbour (12.5 → 12, 13.5 → 14). The default. */
  HalfEven: "half_even",
});

/** One of the codes above. */
export type Rounding = Enum.Value<typeof Rounding>;
