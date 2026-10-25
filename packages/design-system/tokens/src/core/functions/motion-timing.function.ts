/**
 * Stackra file contract:
 * Purpose: turns a theme's motion step (a CSS duration and easing) into numbers for an animation library: milliseconds
 *          and cubic-bezier control points. Web Motion and native Reanimated read a step through this, so a theme's
 *          motion is one set of values on both platforms.
 * Boundary: pure. The named easings map to the control points CSS defines, `cubic-bezier(...)` to its own, and
 *          `steps(...)` to no curve; a `linear(...)` point list, which `defineTheme` accepts, has no cubic-bezier form and
 *          is refused, so a step an animation library plays keeps to the others. Reduced motion is the caller's to apply: the web
 *          stylesheet drops durations to 0ms, and a JavaScript animation checks the preference itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (Stackra Design System).
 */
import type { MotionTiming } from "#contracts/types/motion-timing.type";
import type { Theme } from "#contracts/types/theme.type";

/** The control points of the CSS named easings (CSS Easing Functions Level 1). */
const NAMED: Readonly<Record<string, MotionTiming["bezier"]>> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/**
 * A theme's motion step as numbers.
 * @param theme - the theme, such as `STACKRA_THEME`
 * @param name - the step, such as `reveal`
 * @returns the duration in milliseconds and the easing's control points (none for a stepped easing)
 * @throws RangeError when the theme has no such step, its duration is negative or not a CSS duration, or its easing is a
 *         `linear(...)` point list or not a CSS easing
 */
export function motionTiming(theme: Theme, name: string): MotionTiming {
  const step = theme.motion[name];
  if (!step) throw new RangeError(`The theme ${theme.name} has no motion step ${name}`);
  // `defineTheme`'s number forms (`5`, `5.`, `.5`, `0.5`), without its sign: a negative duration cannot play.
  const duration = /^(\d+(?:\.\d*)?|\.\d+)(ms|s)$/.exec(step.duration);
  if (!duration) throw new RangeError(`Not a CSS duration an animation can play: ${step.duration}`);
  const durationMs = Number(duration[1]) * (duration[2] === "s" ? 1000 : 1);
  const easing = step.easing.trim();
  if (Object.hasOwn(NAMED, easing)) return { durationMs, bezier: NAMED[easing] };
  if (/^(steps\(.*\)|step-start|step-end)$/.test(easing)) return { durationMs, bezier: undefined };
  const curve = /^cubic-bezier\(([^)]*)\)$/.exec(easing);
  const points = curve?.[1]?.split(",").map((point) => Number(point.trim()));
  if (!points || points.length !== 4 || points.some((point) => !Number.isFinite(point)))
    throw new RangeError(`Not an easing an animation library can play: ${step.easing}`);
  return { durationMs, bezier: points as [number, number, number, number] };
}
