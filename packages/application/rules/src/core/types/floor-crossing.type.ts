/**
 * Stackra file contract:
 * Purpose: `FloorCrossing`, what `crossedFloor` found when an outcome parameter is on the wrong side of a floor: the
 *          floor value the parameter must take instead, and why (`past_floor`, or `currency_mismatch` for a money
 *          amount in another currency than the floor's).
 * Boundary: a type only. The reason is the snake_case field error code the rules studio shows at save time.
 * Runtime: isomorphic
 * Governing contract: config-model sections 3 and 4; ADR 0220.
 */
import type { FloorValue } from "#core/types/floor-value.type";

/** One crossed floor. */
export interface FloorCrossing {
  /** The floor value the parameter is moved to. */
  readonly to: FloorValue;

  /** The field error code a save reports. */
  readonly reason: "past_floor" | "currency_mismatch";
}
