/**
 * Stackra file contract:
 * Purpose: the web keyframes of one `ViewStack` move: what the leaving view and the entering view play for a
 *          transition, a way (forward on push, back on pop) and a direction, at a motion level. `push` slides from
 *          the reading end, so a right-to-left page slides from the left; going back mirrors the push. At `reduced`
 *          every transition is a fade that hands over (out, then in), at `none` nothing plays. No frame shows two
 *          views' text over each other: a moving view is drawn opaque over the one it covers.
 * Boundary: pure; the web ViewStack plays them on the View Transition's pseudo-elements, or on the entering view where
 *           the browser has no View Transitions.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0060 (right-to-left); WCAG 2.2 SC 2.3.3.
 */
import type { Direction } from "#contracts/enums/direction.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import type { ViewStackTransition } from "#contracts/enums/view-stack-transition.enum";
import type { ViewStackKeyframes } from "#core/types/view-stack-keyframes.type";

/** The theme's reveal step: quick to start, long to settle. */
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/** A horizontal offset as a transform. */
const x = (percent: number): string => `translateX(${percent}%)`;

/**
 * The keyframes of one move, or `undefined` when nothing plays.
 * @param transition - the stack's transition
 * @param way - `forward` for a push, `back` for a pop
 * @param direction - the text direction; `push` comes from the reading end
 * @param motion - the motion level in force
 */
export function viewStackKeyframes(
  transition: ViewStackTransition,
  way: "forward" | "back",
  direction: Direction,
  motion: MotionLevel,
): ViewStackKeyframes | undefined {
  if (motion === "none" || transition === "none") return undefined;
  // A fade hands over, never cross-fades: the old view is gone by halfway and the new one fades in after it, so no
  // frame shows both views' text at once.
  if (motion === "reduced" || transition === "fade")
    return {
      leaving: [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }],
      entering: [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }],
      durationMs: 240,
      easing: "ease-out",
    };
  // From the top: the new view drops over the old one as an opaque sheet, and going back lifts it off the view under.
  if (transition === "from-top") {
    const above = { transform: "translateY(-100%)" };
    const placed = { transform: "translateY(0)" };
    const still = [{ opacity: 1 }, { opacity: 1 }];
    return way === "forward"
      ? { leaving: still, entering: [above, placed], durationMs: 380, easing: EASING }
      : { leaving: [placed, above], entering: still, durationMs: 380, easing: EASING };
  }
  // The reading end is the right in left-to-right and the left in right-to-left.
  const end = direction === "rtl" ? -100 : 100;
  const behind = transition === "push-parallax" ? -end * 0.3 : -end;
  const dim = transition === "push-parallax" ? 0.7 : 1;
  return way === "forward"
    ? {
        leaving: [
          { transform: x(0), opacity: 1 },
          { transform: x(behind), opacity: dim },
        ],
        entering: [{ transform: x(end) }, { transform: x(0) }],
        durationMs: 420,
        easing: EASING,
      }
    : {
        leaving: [{ transform: x(0) }, { transform: x(end) }],
        entering: [
          { transform: x(behind), opacity: dim },
          { transform: x(0), opacity: 1 },
        ],
        durationMs: 420,
        easing: EASING,
      };
}
