/**
 * Stackra file contract:
 * Purpose: `deviceBox`: the size of a device as drawn, screen and whole body, in its orientation. The desktop's title
 *          bar sits above its screen, inside the body; a tablet or phone on its side swaps its screen's sides.
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import { DEVICE_FRAMES } from "./device-frames.constant";
import type { StudioView } from "./studio-view.type";

/** A device's screen and body sizes, in CSS px. */
export function deviceBox({ device, isLandscape }: Pick<StudioView, "device" | "isLandscape">) {
  const frame = DEVICE_FRAMES[device];
  const isTurned = isLandscape && device !== "desktop";
  const screen = isTurned
    ? { width: frame.height, height: frame.width }
    : { width: frame.width, height: frame.height };
  const chrome = device === "desktop" ? frame.top : 0;
  return {
    frame,
    isLandscape: isTurned,
    screen,
    body: {
      width: screen.width + frame.bezel * 2,
      height: screen.height + frame.bezel * 2 + chrome,
    },
  };
}
