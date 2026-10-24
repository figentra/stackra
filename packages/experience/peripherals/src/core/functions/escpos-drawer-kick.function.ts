/**
 * Stackra file contract:
 * Purpose: `escposDrawerKick`, the ESC/POS pulse (`ESC p m t1 t2`) that opens a cash drawer wired to the printer's
 *          drawer connector: 50 ms on, 500 ms off, on pin 2 or pin 5.
 * Boundary: internal; pure. The pulse lengths are the ones drawer makers specify for a 24 V solenoid; the pin is the
 *           only calibration a drawer needs.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the drawer kicks through the printer).
 */
import type { DrawerPin } from "#contracts/types/drawer-pin.type";

/**
 * The bytes that pulse the drawer on `pin`.
 *
 * @example
 * escposDrawerKick(2); // Uint8Array [27, 112, 0, 25, 250]
 */
export function escposDrawerKick(pin: DrawerPin): Uint8Array {
  return Uint8Array.of(0x1b, 0x70, pin === 2 ? 0 : 1, 25, 250);
}
