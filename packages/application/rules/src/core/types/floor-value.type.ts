/**
 * Stackra file contract:
 * Purpose: `FloorValue`, the value of a floored outcome parameter on either side of a floor: a number, a money
 *          amount as `{ minor, currency }` (`@stackra/money`'s wire form), or a list of strings (a `list` floor).
 * Boundary: a type only. A money floor's pack value carries its currency, so a floor is never compared across
 *           currencies (ADR 0220).
 * Runtime: isomorphic
 * Governing contract: config-model sections 3 and 4; ADR 0370 (decision 6); ADR 0220 (money in minor units); ADR 0455.
 */

/** A number, a money amount in minor units, or a list of strings. */
export type FloorValue =
  | number
  | { readonly minor: number; readonly currency: string }
  | readonly string[];
