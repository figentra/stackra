/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronSmokeDriver`, the desktop placeholder: it serves the `desktop` target and fails every
 *          subject with "not built".
 * Boundary: test only; runs nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (D6, FR-012).
 */
import { describe, expect, it } from "@stackra/testing";

import { ElectronSmokeDriver } from "#node/drivers/electron-smoke.driver";

describe("ElectronSmokeDriver", () => {
  // @covers sta-265:FR-012
  it("fails every desktop subject as not built", async () => {
    const desktop = new ElectronSmokeDriver();
    expect(desktop.target).toBe("desktop");
    const result = await desktop.check({
      target: "desktop",
      name: "till",
      appPath: "dist/Till.app",
    });
    expect(result.passed).toBe(false);
    expect(result.problems[0]).toContain("not built");
  });
});
