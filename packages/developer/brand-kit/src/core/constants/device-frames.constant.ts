/**
 * Stackra file contract:
 * Purpose: `DEVICE_FRAMES`, the store-screenshot canvases the generator draws a caption and a captured screen into:
 *          the sizes App Store Connect and Google Play take for a phone and a tablet.
 * Boundary: data only. A store that changes its accepted size changes this table.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19).
 */
import type { DeviceFrame } from "#core/types/device-frame.type";

/** The frames each caption is drawn into. */
export const DEVICE_FRAMES: readonly DeviceFrame[] = Object.freeze([
  { id: "ios_phone", width: 1320, height: 2868, radius: 96 },
  { id: "ios_tablet", width: 2064, height: 2752, radius: 48 },
  { id: "android_phone", width: 1080, height: 2400, radius: 64 },
]);
