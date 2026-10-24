/**
 * Stackra file contract:
 * Purpose: proves `motionTiming` reads a motion step's duration in ms and s, maps the CSS named easings to their control
 *          points, reads `cubic-bezier(...)`, gives a stepped easing no curve, refuses a missing step or a value it
 *          cannot play, and reads every step of the Stackra theme.
 * Boundary: pure; no animation library.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0022 (test placement).
 */
// @covers sta-430:FR-001
import type { MotionToken } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { motionTiming } from "#core/functions/motion-timing.function";

/** The timing of one step in a theme that has only that step. */
const timingOf = (step: MotionToken) =>
  motionTiming({ ...STACKRA_THEME, motion: { only: step } }, "only");

describe("motionTiming", () => {
  it("reads the duration in milliseconds or seconds", () => {
    expect(timingOf({ duration: "400ms", easing: "linear" }).durationMs).toBe(400);
    expect(timingOf({ duration: "0.25s", easing: "linear" }).durationMs).toBe(250);
  });

  it("maps the named easings to the control points CSS defines", () => {
    expect(timingOf({ duration: "1ms", easing: "ease" }).bezier).toEqual([0.25, 0.1, 0.25, 1]);
    expect(timingOf({ duration: "1ms", easing: "ease-out" }).bezier).toEqual([0, 0, 0.58, 1]);
    expect(timingOf({ duration: "1ms", easing: "ease-in-out" }).bezier).toEqual([0.42, 0, 0.58, 1]);
  });

  it("reads a cubic-bezier, and gives a stepped easing no curve", () => {
    expect(timingOf({ duration: "1ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" }).bezier).toEqual([
      0.22, 1, 0.36, 1,
    ]);
    expect(timingOf({ duration: "1ms", easing: "steps(1)" }).bezier).toBeUndefined();
  });

  it("refuses a missing step, and a duration or an easing it cannot play", () => {
    expect(() => motionTiming(STACKRA_THEME, "missing")).toThrow(RangeError);
    expect(() => timingOf({ duration: "fast", easing: "linear" })).toThrow(RangeError);
    expect(() => timingOf({ duration: "1ms", easing: "cubic-bezier(1, 2)" })).toThrow(RangeError);
  });

  it("reads every step of the Stackra theme, the reveal and stagger steps included", () => {
    for (const name of Object.keys(STACKRA_THEME.motion))
      expect(motionTiming(STACKRA_THEME, name).durationMs).toBeGreaterThan(0);
    expect(motionTiming(STACKRA_THEME, "reveal")).toEqual({
      durationMs: 400,
      bezier: [0.22, 1, 0.36, 1],
    });
    expect(motionTiming(STACKRA_THEME, "stagger").durationMs).toBe(40);
  });
});
