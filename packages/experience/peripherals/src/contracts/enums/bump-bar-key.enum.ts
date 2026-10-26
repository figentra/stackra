/**
 * Stackra file contract:
 * Purpose: `BumpBarKey`, what a kitchen bump bar key means once its driver has mapped the device's keys: bump the
 *          selected ticket, recall the last bumped one, move the selection, or select.
 * Boundary: an `Enum.of` value plus the type of the same name; the argument of a `BumpBar` listener. The key layout of
 *           a device is its driver's mapping.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4); ADR 0294 (decision 16); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The actions of a bump bar. */
export const BumpBarKey = Enum.of({
  /** Marks the selected ticket done. */
  Bump: "bump",
  /** Brings back the last bumped ticket. */
  Recall: "recall",
  /** Moves the selection to the next ticket. */
  Next: "next",
  /** Moves the selection to the previous ticket. */
  Previous: "previous",
  /** Selects or opens the ticket under the cursor. */
  Select: "select",
});

/** One of the codes above. */
export type BumpBarKey = Enum.Value<typeof BumpBarKey>;
