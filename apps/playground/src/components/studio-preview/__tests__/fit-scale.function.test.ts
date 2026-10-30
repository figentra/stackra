/**
 * Stackra file contract:
 * Purpose: proves Fit scales the whole device to the tighter of the room's width and height, counts two devices and
 *          their gap side by side, never draws above real size and waits for a measured room.
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
import { deviceBox } from "#src/components/studio-preview/device-box.function";
import { fitScale } from "#src/components/studio-preview/fit-scale.function";

describe("fitScale", () => {
  const iphone = deviceBox({ device: "iphone", isLandscape: false }).body; // 417 x 876

  it("fits a tall phone to the room's height", () => {
    expect(fitScale({ width: 1200, height: 438 }, iphone, 1, 32)).toBe(0.5);
  });

  it("fits a wide desktop to the room's width", () => {
    const desktop = deviceBox({ device: "desktop", isLandscape: false }).body; // 1280 x 840
    expect(fitScale({ width: 640, height: 2000 }, desktop, 1, 32)).toBe(0.5);
  });

  it("counts two devices and the gap between them side by side", () => {
    // 417 * 2 + 32 = 866
    expect(fitScale({ width: 433, height: 5000 }, iphone, 2, 32)).toBe(0.5);
  });

  it("never draws larger than real size, and draws at 1 before the room is measured", () => {
    expect(fitScale({ width: 5000, height: 5000 }, iphone, 1, 32)).toBe(1);
    expect(fitScale({ width: 0, height: 0 }, iphone, 1, 32)).toBe(1);
  });

  it("floors, so the scaled device never spills past the room", () => {
    const scale = fitScale({ width: 1000, height: 700 }, iphone, 1, 32);
    expect(iphone.height * scale).toBeLessThanOrEqual(700);
  });
});
