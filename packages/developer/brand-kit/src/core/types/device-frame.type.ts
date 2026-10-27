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
  /** The frame's id, used in the generated file names. */
  readonly id: string;

  /** The canvas width in px. */
  readonly width: number;

  /** The canvas height in px. */
  readonly height: number;

  /** The screen's corner radius in px. */
  readonly radius: number;
}
