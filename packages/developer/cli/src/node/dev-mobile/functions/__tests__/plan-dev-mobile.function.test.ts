/**
 * Stackra file contract:
 * Purpose: unit tests of `planDevMobile`: an iOS prebuild with a UTF-8 locale, then a Release run on the given device
 *          with no bundler.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { planDevMobile } from "#node/dev-mobile/functions/plan-dev-mobile.function";

describe("planDevMobile", () => {
  it("prebuilds, then runs a Release build on the device without a bundler", () => {
    const [prebuild, run] = planDevMobile("/repo/.stackra/mobile/app", "SIM-1");
    expect(prebuild).toMatchObject({
      command: "expo",
      args: ["prebuild", "--platform", "ios", "--clean"],
    });
    expect(prebuild?.env?.["LANG"]).toBe("en_US.UTF-8");
    expect(run).toEqual({
      command: "expo",
      args: ["run:ios", "--configuration", "Release", "--device", "SIM-1", "--no-bundler"],
      cwd: "/repo/.stackra/mobile/app",
      env: { LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" },
    });
  });
});
