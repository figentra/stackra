/**
 * Stackra file contract:
 * Purpose: proves each device keeps its CSS viewport, a tablet or phone on its side swaps its screen's sides, the
 *          desktop ignores the orientation, and the body is the screen with even bezels (and the desktop's title bar).
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
import { deviceBox } from "#src/components/studio-preview/device-box.function";

describe("deviceBox", () => {
  it("draws each device at its viewport, portrait", () => {
    expect(deviceBox({ device: "iphone", isLandscape: false }).screen).toEqual({
      width: 393,
      height: 852,
    });
    expect(deviceBox({ device: "android", isLandscape: false }).screen).toEqual({
      width: 412,
      height: 915,
    });
    expect(deviceBox({ device: "tablet", isLandscape: false }).screen).toEqual({
      width: 834,
      height: 1194,
    });
    expect(deviceBox({ device: "desktop", isLandscape: false }).screen).toEqual({
      width: 1280,
      height: 800,
    });
  });

  it("turns a tablet or phone on its side, not the desktop", () => {
    expect(deviceBox({ device: "tablet", isLandscape: true }).screen).toEqual({
      width: 1194,
      height: 834,
    });
    expect(deviceBox({ device: "iphone", isLandscape: true }).isLandscape).toBe(true);
    const desktop = deviceBox({ device: "desktop", isLandscape: true });
    expect(desktop.isLandscape).toBe(false);
    expect(desktop.screen).toEqual({ width: 1280, height: 800 });
  });

  it("wraps the screen in even bezels, and the desktop's title bar", () => {
    expect(deviceBox({ device: "tablet", isLandscape: false }).body).toEqual({
      width: 878,
      height: 1238,
    });
    expect(deviceBox({ device: "desktop", isLandscape: false }).body).toEqual({
      width: 1280,
      height: 840,
    });
  });
});
