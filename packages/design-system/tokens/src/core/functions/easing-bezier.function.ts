/**
 * Stackra file contract:
 * Purpose: `easingBezier` reads a CSS easing as cubic-bezier control points, the form web Motion and native Reanimated
 *          (`Easing.bezier(...)`) take, so an animation library plays the curve the stylesheet does.
 * Boundary: pure. The CSS named easings map to the control points CSS defines, `cubic-bezier(...)` to its own and
 *          `steps(...)` to no curve; a `linear(...)` point list has no cubic-bezier form and is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */
import type { MotionTiming } from "#contracts/types/motion-timing.type";

/** The control points of the CSS named easings (CSS Easing Functions Level 1). */
const NAMED: Readonly<Record<string, MotionTiming["bezier"]>> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/**
 * A CSS easing as cubic-bezier control points.
 * @param easing - a CSS named easing, `cubic-bezier(...)`, or a stepped easing
 * @returns the control points, or `undefined` for a stepped easing
 * @throws RangeError for a `linear(...)` point list or text that is not a CSS easing
 */
export function easingBezier(easing: string): MotionTiming["bezier"] {
  const text = easing.trim();
  if (Object.hasOwn(NAMED, text)) return NAMED[text];
  if (/^(steps\(.*\)|step-start|step-end)$/.test(text)) return undefined;
  const curve = /^cubic-bezier\(([^)]*)\)$/.exec(text);
  const points = curve?.[1]?.split(",").map((point) => Number(point.trim()));
  if (!points || points.length !== 4 || points.some((point) => !Number.isFinite(point)))
    throw new RangeError(`Not an easing an animation library can play: ${easing}`);
  return points as [number, number, number, number];
}
