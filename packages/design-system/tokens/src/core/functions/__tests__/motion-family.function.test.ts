/**
 * Stackra file contract:
 * Purpose: proves the motion family of ADR 0501: `motionEasing` and `motionSpring` read the Stackra theme's easings
 *          and springs and refuse a missing one; `springCurve` samples a spring into a `linear()` curve that starts at
 *          0, ends at 1, overshoots only when underdamped and settles in a plausible time; `defineTheme` refuses an
 *          unplayable easing, a non-positive spring, a press scale or entrance distance out of range, an unknown haptic
 *          pattern and a bad accessibility value.
 * Boundary: pure; no animation library.
 * Runtime: node
 * Governing contract: ADR 0501 (tokens v2, the motion family, accessibility modes); ADR 0022 (test placement).
 */
import type { Theme } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { defineTheme } from "#core/functions/define-theme.function";
import { easingBezier } from "#core/functions/easing-bezier.function";
import { motionEasing } from "#core/functions/motion-easing.function";
import { motionSpring } from "#core/functions/motion-spring.function";
import { springCurve } from "#core/functions/spring-curve.function";

/** The problems `defineTheme` lists for `theme`, or none. */
const problemsOf = (theme: unknown): readonly string[] => {
  try {
    defineTheme(theme as Theme);
    return [];
  } catch (error) {
    if (error instanceof InvalidThemeError) return error.problems;
    throw error;
  }
};

/** The samples of a `linear()` curve. */
const samplesOf = (css: string) =>
  css
    .slice("linear(".length, -1)
    .split(",")
    .map((sample) => Number(sample.trim()));

describe("the motion family", () => {
  it("reads the named easings as control points", () => {
    expect(motionEasing(STACKRA_THEME, "standard")).toEqual([0.2, 0, 0, 1]);
    expect(motionEasing(STACKRA_THEME, "exit")).toEqual([0.4, 0, 1, 1]);
    expect(() => motionEasing(STACKRA_THEME, "missing")).toThrow(RangeError);
    const stepped = {
      ...STACKRA_THEME,
      animation: { ...STACKRA_THEME.animation, easings: { s: "steps(2)" } },
    };
    expect(() => motionEasing(stepped, "s")).toThrow(RangeError);
    expect(easingBezier("ease-in")).toEqual([0.42, 0, 1, 1]);
    expect(() => easingBezier("linear(0, 1)")).toThrow(RangeError);
  });

  it("reads the spring presets, the same physics for Motion and Reanimated", () => {
    expect(motionSpring(STACKRA_THEME, "snappy")).toEqual({
      stiffness: 260,
      damping: 22,
      mass: 0.8,
    });
    for (const name of ["gentle", "snappy", "bouncy"])
      expect(motionSpring(STACKRA_THEME, name).stiffness).toBeGreaterThan(0);
    expect(() => motionSpring(STACKRA_THEME, "missing")).toThrow(RangeError);
    // The measured settle (flat to the eye at about 550ms) never passes its target; the curve runs to within 0.1%.
    const settle = springCurve(motionSpring(STACKRA_THEME, "settle"));
    expect(Math.max(...samplesOf(settle.css))).toBeLessThanOrEqual(1);
    expect(settle.durationMs).toBeGreaterThan(450);
    expect(settle.durationMs).toBeLessThan(1000);
    // The heavy flip rebounds a little.
    expect(
      Math.max(...samplesOf(springCurve(motionSpring(STACKRA_THEME, "flip")).css)),
    ).toBeGreaterThan(1);
  });

  it("samples a spring into a linear() curve from 0 to 1 that settles", () => {
    const bouncy = springCurve(motionSpring(STACKRA_THEME, "bouncy"));
    const samples = samplesOf(bouncy.css);
    expect(samples[0]).toBe(0);
    expect(samples.at(-1)).toBe(1);
    expect(Math.max(...samples)).toBeGreaterThan(1);
    expect(bouncy.durationMs).toBeGreaterThan(300);
    expect(bouncy.durationMs).toBeLessThan(1500);

    // Critically damped (damping = 2 * sqrt(stiffness * mass)): no overshoot.
    const still = samplesOf(springCurve({ stiffness: 100, damping: 20, mass: 1 }).css);
    expect(Math.max(...still)).toBeLessThanOrEqual(1);
    // A spring too loose to settle is cut at 3 seconds.
    expect(springCurve({ stiffness: 10, damping: 0.01, mass: 1 }).durationMs).toBe(3000);
  });

  it("accepts the Stackra theme and refuses a bad motion, haptic or accessibility value", () => {
    expect(problemsOf(STACKRA_THEME)).toEqual([]);
    const animation = {
      easings: { standard: "linear(0, 1)", ok: "ease" },
      springs: { soft: { stiffness: 0, damping: 10, mass: 1 } },
      pressScale: 0.5,
      enterDistance: "1rem",
    };
    expect(
      problemsOf({
        ...STACKRA_THEME,
        animation,
        haptics: { tap: "buzz" },
        accessibility: {
          contrast: { nope: STACKRA_THEME.colors.muted },
          textScales: { tiny: 0.5 },
          chartSafe: "red",
        },
      }),
    ).toEqual([
      "animation.easings.standard is not a named easing or a cubic-bezier()",
      "animation.springs.soft.stiffness is not a number above 0",
      "animation.pressScale is not a scale from 0.8 to 1",
      "animation.enterDistance is not a px length",
      expect.stringMatching(/^haptics\.tap is not one of selection/),
      "accessibility.contrast.nope is not a colour role",
      "accessibility.textScales.tiny is not a scale from 1 to 3",
      "accessibility.chartSafe is missing",
    ]);
    expect(
      problemsOf({ ...STACKRA_THEME, animation: undefined, accessibility: undefined }),
    ).toEqual(expect.arrayContaining(["animation is missing", "accessibility is missing"]));
  });

  it("refuses an easing name that writes the same property as a motion step", () => {
    const clash = {
      ...STACKRA_THEME,
      animation: { ...STACKRA_THEME.animation, easings: { fast: "ease" } },
    };
    expect(problemsOf(clash)).toContain("--ease-fast is written by two tokens");
  });
});
