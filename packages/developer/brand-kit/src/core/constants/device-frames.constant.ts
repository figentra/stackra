/**
 * Stackra file contract:
 * Purpose: `DEVICE_FRAMES`, the store-screenshot canvases the generator draws a caption and a captured screen into:
 *          the sizes App Store Connect and Google Play take for a phone and a tablet (same sizes as the release
 *          store check's targets, `tools/scripts/store-build.mjs`).
 * Boundary: data only. A store that changes its accepted size changes this table. Play takes 320 to 3840 px per side
 *           with the long side at most twice the short one (STA-1577: 1080x2400 was refused).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19).
 */
import type { DeviceFrame } from "#core/types/device-frame.type";

/** The frames each caption is drawn into. */
export const DEVICE_FRAMES: readonly DeviceFrame[] = Object.freeze([
  { id: "ios_phone", width: 1290, height: 2796, radius: 96 },
  { id: "ios_tablet", width: 2048, height: 2732, radius: 48 },
  { id: "android_phone", width: 1080, height: 1920, radius: 64 },
  { id: "android_tablet_7", width: 1200, height: 1920, radius: 48 },
  { id: "android_tablet_10", width: 1600, height: 2560, radius: 48 },
]);
