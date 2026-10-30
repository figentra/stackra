/**
 * Stackra file contract:
 * Purpose: `fitScale`: the scale that fits `count` devices, side by side `gap` apart, whole inside the room the
 *          canvas has, never above 1 (a device is not drawn larger than its real size).
 * Boundary: pure; a room not measured yet (0) draws at 1.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */

interface Size {
  readonly width: number;
  readonly height: number;
}

/** The scale, floored to a thousandth so rounding never spills a pixel into a scrollbar. */
export function fitScale(room: Size, body: Size, count: number, gap: number): number {
  if (room.width <= 0 || room.height <= 0) return 1;
  const width = body.width * count + gap * (count - 1);
  const scale = Math.min(1, room.width / width, room.height / body.height);
  return Math.max(0.05, Math.floor(scale * 1000) / 1000);
}
