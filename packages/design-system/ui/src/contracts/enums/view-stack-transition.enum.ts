/**
 * Stackra file contract:
 * Purpose: the one transition vocabulary of a drill-down on web and native: `push` (the new view slides in from the
 *          reading end), `push-parallax` (the same, the old view drifting a third of the way behind it), `from-top`
 *          (the new view drops in from the top), `fade` and `none`. Going back plays the push mirrored.
 * Boundary: the values only; `ViewStack` plays them (View Transitions on web, Reanimated on native) and
 *           `nativeStackAnimationOf` maps them onto a native-stack screen.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3); ADR 0060 (right-to-left).
 */

/** The view stack transitions. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the transitions carry no labels.
export const ViewStackTransition = Object.freeze([
  "push",
  "push-parallax",
  "from-top",
  "fade",
  "none",
] as const);

/** One view stack transition. */
export type ViewStackTransition = (typeof ViewStackTransition)[number];
