/**
 * Stackra file contract:
 * Purpose: `DeviceFrame`, one store-screenshot canvas: its id (used in file names), size in px and the screen's corner
 *          radius.
 * Boundary: a type of the `.` entry; no runtime value.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19).
 */

/** One device frame. */
export interface DeviceFrame {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}
