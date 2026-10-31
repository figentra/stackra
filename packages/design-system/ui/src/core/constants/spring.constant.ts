/**
 * Stackra file contract:
 * Purpose: `SPRING`, the spring every springy indicator plays (a tab indicator, a ticker settling): the theme's
 *          `bouncy` preset as a CSS `linear()` curve with its duration for web, and as Reanimated spring physics for
 *          native, so both platforms play one set of numbers.
 * Boundary: data only, read from the stackra theme's motion family; played only at the `full` motion level.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */
import { motionSpring, springCurve, STACKRA_THEME } from "@stackra/tokens";

const BOUNCY = motionSpring(STACKRA_THEME, "bouncy");
const CURVE = springCurve(BOUNCY);

/** The spring: a light overshoot that settles in under a second. */
export const SPRING = Object.freeze({
  /** The CSS easing, the sampled spring. */
  css: CURVE.css,
  /** The duration the CSS curve is drawn over, in milliseconds. */
  durationMs: CURVE.durationMs,
  /** Reanimated's spring physics for the same feel. */
  native: BOUNCY,
});
