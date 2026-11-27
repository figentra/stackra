/**
 * Stackra file contract:
 * Purpose: `MaskMethod`, what a masked copy of the data (a staging copy, a seed pack) writes in place of the fields of a
 *          data class: the value, a keyed hash that keeps equal values equal, a generated stand-in, or null.
 * Boundary: an `Enum.of` value plus the type of the same name; one of the eight effects a data class sets. `maskOf`
 *           gives each field's method; the masker applies it, never a hand-kept list of columns.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 1: the `mask` effect); data-layer gap gov15.
 */
import { Enum } from "@stackra/contracts";

/** How a masked copy writes a class's fields. */
export const MaskMethod = Enum.of({
  /** Copied as it is. */
  Keep: "keep",
  /** A keyed hash, so joins on the field still match. */
  Hash: "hash",
  /** A generated value of the same shape. */
  Fake: "fake",
  /** Null. */
  Null: "null",
});

/** One of the codes above. */
export type MaskMethod = Enum.Value<typeof MaskMethod>;
