/**
 * Stackra file contract:
 * Purpose: `motionSpring` reads a theme's spring preset (`gentle`, `snappy`, `bouncy`) as the physics both animation
 *          libraries take: `withSpring(to, motionSpring(theme, "snappy"))` in Reanimated and
 *          `{ type: "spring", ...motionSpring(theme, "snappy") }` in Motion.
 * Boundary: pure; reduced motion is the caller's (a spring under `reduced` becomes a fade or a jump).
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */
import type { SpringToken } from "#contracts/types/spring-token.type";
import type { Theme } from "#contracts/types/theme.type";

/**
 * A theme's spring preset.
 * @param theme - the theme, such as `STACKRA_THEME`
 * @param name - the preset, such as `snappy`
 * @returns its stiffness, damping and mass
 * @throws RangeError when the theme has no such spring
 */
export function motionSpring(theme: Theme, name: string): SpringToken {
  const spring = theme.animation.springs[name];
  if (spring === undefined) throw new RangeError(`The theme ${theme.name} has no spring ${name}`);
  return spring;
}
