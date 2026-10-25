/**
 * Stackra file contract:
 * Purpose: `StaffSwitch`, who is working a shared device after a PIN quick-switch: the device, the staff principal and
 *          since when.
 * Boundary: a type only. The device stays signed in as itself; the switch names the staff member the till records on
 *           each sale line and checks permissions for.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); owner round 3 #15, #17.
 */
import type { PublicId } from "@stackra/contracts";

/** The staff member on a device. */
export interface StaffSwitch {
  /** The shared device. */
  readonly device: PublicId;

  /** The staff member now working it. */
  readonly staff: PublicId;

  /** When the switch happened. */
  readonly at: Date;
}
