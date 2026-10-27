/**
 * Stackra file contract:
 * Purpose: `StoreFrameContent`, what one store frame shows: the theme, the device frame, the locale, the caption and the
 *          captured screenshot when there is one.
 * Boundary: a type of the `.` entry; no runtime value.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19).
 */
import type { Theme } from "@stackra/tokens/contracts";

import type { DeviceFrame } from "#core/types/device-frame.type";

/** What one frame shows. */
export interface StoreFrameContent {
  /** The kit's theme the frame is drawn in. */
  readonly theme: Theme;

  /** The device frame that sets the canvas. */
  readonly frame: DeviceFrame;

  /** The locale the caption is written in. */
  readonly locale: string;

  /** The caption text the frame shows. */
  readonly caption: string;

  /** The captured screenshot PNG; absent when none was captured. */
  readonly screenshot?: Uint8Array;
}
