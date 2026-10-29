/**
 * Stackra file contract:
 * Purpose: unit tests of `DEVICE_FRAMES`: the exact frame set, and every Android frame inside Google Play's screenshot
 *          limits (320 to 3840 px per side, long side at most twice the short one).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: D19).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVICE_FRAMES } from "#core/constants/device-frames.constant";

describe("DEVICE_FRAMES", () => {
  it("has the phone and tablet frames of both stores", () => {
    expect(DEVICE_FRAMES.map(({ id, width, height }) => `${id} ${width}x${height}`)).toEqual([
      "ios_phone 1290x2796",
      "ios_tablet 2048x2732",
      "android_phone 1080x1920",
      "android_tablet_7 1200x1920",
      "android_tablet_10 1600x2560",
    ]);
  });

  it("keeps every Android frame inside Play's size and ratio limits", () => {
    for (const { id, width, height } of DEVICE_FRAMES.filter((f) => f.id.startsWith("android"))) {
      const [short, long] = [Math.min(width, height), Math.max(width, height)];
      expect(short, id).toBeGreaterThanOrEqual(320);
      expect(long, id).toBeLessThanOrEqual(3840);
      expect(long / short, id).toBeLessThanOrEqual(2);
    }
  });
});
