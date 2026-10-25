/**
 * Stackra file contract:
 * Purpose: `PairingState`, where a pairing code stands: waiting for a person to enter it, entered (the device is
 *          paired), or past its expiry unused.
 * Boundary: an `Enum.of` value plus the type of the same name; the wire values of the hub's pairing answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7: the pairing port); ADR 0294 (decision 16); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** A pairing code's state. */
export const PairingState = Enum.of({
  /** Shown on the device, not yet entered. */
  Pending: "pending",
  /** Entered in the console; the device is registered. */
  Paired: "paired",
  /** Not entered before it expired. */
  Expired: "expired",
});

/** One of the codes above. */
export type PairingState = Enum.Value<typeof PairingState>;
