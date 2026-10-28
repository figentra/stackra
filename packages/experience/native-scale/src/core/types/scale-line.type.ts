/**
 * Stackra file contract:
 * Purpose: `ScaleLine`, one line a scale sent, as a protocol parser reads it: a weight (net value in its display unit,
 *          the same in grams, settled or not, net or gross where the protocol says), a tare, or a fault (over
 *          capacity, under zero, busy, or a command error).
 * Boundary: a type only, internal to this package's drivers. A line no parser knows is `null`, never a fault. Grams
 *           are converted from the unit the scale sent; a unit with no gram value (pieces, percent) is not a weight.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: mapping stays in the TypeScript driver); ADR 0253.
 */

/** A parsed scale line. */
export type ScaleLine =
  | {
      readonly kind: "weight";
      /** The value as the scale displayed it, in `unit`. */
      readonly value: number;
      /** The unit the scale sent (`g`, `kg`, `lb`, `oz`). */
      readonly unit: string;
      /** The value in grams. */
      readonly grams: number;
      /** True when the scale marked the weight settled. */
      readonly isStable: boolean;
      /** True for a net weight, false for a gross one, null when the protocol does not say. */
      readonly isNet: boolean | null;
    }
  | {
      readonly kind: "tare";
      /** The tare in grams. */
      readonly grams: number;
    }
  | {
      readonly kind: "fault";
      /** Why there is no weight. */
      readonly fault: "overload" | "underload" | "busy" | "error";
    };
