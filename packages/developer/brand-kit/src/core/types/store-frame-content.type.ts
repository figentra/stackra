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
  readonly theme: Theme;
  readonly frame: DeviceFrame;
  readonly locale: string;
  readonly caption: string;
  readonly screenshot?: Uint8Array;
}
