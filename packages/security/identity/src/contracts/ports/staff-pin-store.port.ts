/**
 * Stackra file contract:
 * Purpose: the `StaffPinStore` port: where a shared device keeps its staff PIN credentials: read one, write one,
 *          remove one, list the device's.
 * Boundary: an abstract class that is its own token. A device driver keeps them in the `secrets` storage area so a
 *           till checks PINs offline; the OS identity service keeps the enrolment. The rules are `StaffPinService`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); owner round 3 #15; ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { StaffPinCredential } from "#contracts/types/staff-pin-credential.type";

/**
 * Keeps staff PINs.
 *
 * @example
 * const credential = await pins.get(till.id, cashier.id);
 */
export abstract class StaffPinStore extends Port {
  /** The credential of `principal` on `device`, or `undefined`. */
  abstract get(device: PublicId, principal: PublicId): Promise<StaffPinCredential | undefined>;

  /** Writes `credential`, replacing the one for its device and principal. */
  abstract put(credential: StaffPinCredential): Promise<void>;

  /** Removes the credential of `principal` on `device`; `false` when there was none. */
  abstract remove(device: PublicId, principal: PublicId): Promise<boolean>;

  /** The principals with a PIN on `device`, for the till's staff picker. */
  abstract principals(device: PublicId): Promise<readonly PublicId[]>;
}
