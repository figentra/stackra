/**
 * Stackra file contract:
 * Purpose: the app-wide motion setting: `full` plays every animation, `reduced` swaps movement for short fades, `none`
 *          plays nothing. The operating system's reduce-motion setting lowers `full` to `reduced`, never raises it.
 * Boundary: the values only; each `DesignSystemProvider` holds the setting and `useMotion()` reads it resolved.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3: one API); WCAG 2.2 SC 2.3.3.
 */

/** The motion levels, from most to least. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the levels carry no labels.
export const MotionLevel = Object.freeze(["full", "reduced", "none"] as const);

/** One motion level. */
export type MotionLevel = (typeof MotionLevel)[number];
