/**
 * Stackra file contract:
 * Purpose: `motionEasing` reads a theme's named easing (`standard`, `emphasized`, `enter`, `exit`) as cubic-bezier
 *          control points, so web Motion, native Reanimated (`Easing.bezier(...)`) and the stylesheet play one curve.
 * Boundary: pure; reads through `easingBezier`.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */
import type { Theme } from "#contracts/types/theme.type";
import { easingBezier } from "#core/functions/easing-bezier.function";

/**
 * A theme's named easing as cubic-bezier control points.
 * @param theme - the theme, such as `STACKRA_THEME`
 * @param name - the easing, such as `standard`
 * @returns the control points `[x1, y1, x2, y2]`
 * @throws RangeError when the theme has no such easing, or it has no cubic-bezier form
 */
export function motionEasing(
  theme: Theme,
  name: string,
): readonly [number, number, number, number] {
  const easing = theme.animation.easings[name];
  if (easing === undefined) throw new RangeError(`The theme ${theme.name} has no easing ${name}`);
  const bezier = easingBezier(easing);
  if (bezier === undefined) throw new RangeError(`The easing ${name} is stepped, not a curve`);
  return bezier;
}
