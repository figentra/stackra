/**
 * Stackra file contract:
 * Purpose: `PickupPointKind`, what a carrier pickup point is: a self-service parcel locker or a staffed counter (a
 *          shop or the carrier's own office), so checkout can show each with its own marker and wording.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A connector maps its carrier's point
 *           types onto these codes. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (open question 1, COM-156); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * Pickup point kinds.
 *
 * @example
 * const lockers = points.filter((point) => point.kind === PickupPointKind.Locker);
 */
export const PickupPointKind = Enum.of({
  /** A self-service parcel locker, opened with a code. */
  Locker: "locker",
  /** A staffed counter: a partner shop or a carrier office. */
  Counter: "counter",
});

/** One of the codes above. */
export type PickupPointKind = Enum.Value<typeof PickupPointKind>;
