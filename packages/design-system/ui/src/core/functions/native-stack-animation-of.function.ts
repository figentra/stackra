/**
 * Stackra file contract:
 * Purpose: the native-stack screen `animation` for a `ViewStackTransition`, so a screen-level drill-down in the app's
 *          navigator moves like an in-screen `ViewStack`: `push` slides from the reading end, `push-parallax` is the
 *          iOS-style push with the old screen drifting behind, at `reduced` a fade and at `none` nothing.
 * Boundary: pure; the app passes the result as the screen's `animation` option. native-stack has no drop from the
 *           top, so `from-top` is a fade there.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0060 (right-to-left).
 */
import type { Direction } from "#contracts/enums/direction.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import type { ViewStackTransition } from "#contracts/enums/view-stack-transition.enum";
import type { NativeStackAnimation } from "#core/types/native-stack-animation.type";

/**
 * The native-stack animation of a transition.
 * @param transition - the transition
 * @param direction - the text direction; a push comes from the reading end
 * @param motion - the motion level in force; defaults to `full`
 */
export function nativeStackAnimationOf(
  transition: ViewStackTransition,
  direction: Direction,
  motion: MotionLevel = "full",
): NativeStackAnimation {
  if (motion === "none" || transition === "none") return "none";
  if (motion === "reduced" || transition === "fade" || transition === "from-top") return "fade";
  const side = direction === "rtl" ? "left" : "right";
  return transition === "push-parallax" ? `ios_from_${side}` : `slide_from_${side}`;
}
