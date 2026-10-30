/**
 * Stackra file contract:
 * Purpose: `DEVICE_FRAMES`: each device the studio canvas draws, in CSS px, portrait: the screen (the CSS viewport),
 *          the bezel around it, the body's and the screen's corner radius, and the bars drawn over the screen's top
 *          (status bar, or a browser's title bar for the desktop) and bottom (home indicator or gesture bar).
 *          - iPad: an 11-inch-class tablet, 834 x 1194; iPhone: a 6.1-inch-class phone, 393 x 852; Android: 412 x 915.
 * Boundary: data only, in its own file. The shapes are drawn by the studio (clean-room), no maker's artwork.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */

/** The devices, portrait. */
export const DEVICE_FRAMES = {
  desktop: { width: 1280, height: 800, bezel: 0, radius: 12, screenRadius: 0, top: 40, bottom: 0 },
  tablet: {
    width: 834,
    height: 1194,
    bezel: 22,
    radius: 42,
    screenRadius: 20,
    top: 24,
    bottom: 20,
  },
  iphone: { width: 393, height: 852, bezel: 12, radius: 66, screenRadius: 54, top: 54, bottom: 34 },
  android: {
    width: 412,
    height: 915,
    bezel: 10,
    radius: 46,
    screenRadius: 36,
    top: 32,
    bottom: 24,
  },
} as const;
