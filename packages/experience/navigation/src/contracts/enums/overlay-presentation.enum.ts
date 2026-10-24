/**
 * Stackra file contract:
 * Purpose: how a route overlay is drawn: `modal` (a centred dialog), `sheet` (a panel from the bottom edge), `drawer`
 *          (a panel from the reading-end edge, which a narrow web window turns into a sheet) or `full-screen` (the
 *          whole screen). A route class names one; the web renderer maps it onto `Modal` and `Drawer`, the native one
 *          onto the stack navigator's `presentation`.
 * Boundary: the values only; each runtime decides what they look like.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 9); ADR 0303 (decision 7); ADR 0294 (vocabulary: Modal, Sheet, Drawer,
 *          FullScreen).
 */

/** The presentations a route overlay takes. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the choices carry no labels.
export const OverlayPresentation = Object.freeze([
  "modal",
  "sheet",
  "drawer",
  "full-screen",
] as const);

/** One presentation of a route overlay. */
export type OverlayPresentation = (typeof OverlayPresentation)[number];
