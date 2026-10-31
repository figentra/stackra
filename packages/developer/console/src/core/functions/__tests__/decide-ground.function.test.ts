/**
 * Stackra file contract:
 * Purpose: proves `decideGround` honours STACKRA_GROUND, reads the COLORFGBG background, and falls back to dark; and
 *          that a run on a dark ground paints the Stackra banner with the dark-ground colours.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-016; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-016
import { colourEscape } from "#core/functions/colour-escape.function";
import { decideGround } from "#core/functions/decide-ground.function";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

describe("decideGround", () => {
  it.each([
    [{}, "dark"],
    [{ COLORFGBG: "15;0" }, "dark"],
    [{ COLORFGBG: "0;default;8" }, "dark"],
    [{ COLORFGBG: "0;15" }, "light"],
    [{ COLORFGBG: "0;7" }, "light"],
    [{ COLORFGBG: "garbage" }, "dark"],
    [{ COLORFGBG: "0;15", STACKRA_GROUND: "dark" }, "dark"],
    [{ STACKRA_GROUND: "light" }, "light"],
  ] as const)("reads %j as %s", (env, ground) => {
    expect(decideGround(env)).toBe(ground);
  });

  it("paints the Stackra banner with the dark-ground colours only on a dark ground", async () => {
    const dark = await runCommandForTest([], [], { colour: true });
    const light = await runCommandForTest([], [], { colour: true, env: { COLORFGBG: "0;15" } });
    expect(dark.stdout).toContain(colourEscape("#A7B6C7", 24));
    expect(dark.stdout).not.toContain(colourEscape("#647384", 24));
    expect(light.stdout).toContain(colourEscape("#647384", 24));
  });
});
