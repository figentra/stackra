/**
 * Stackra file contract:
 * Purpose: the edge of the screen the toast region sits against: the top or the bottom, centred. HeroUI calls this
 *          `placement` on its Toast, and the wave 4 vocabulary keeps that word for `Placement`, so a toast takes
 *          `position`.
 * Boundary: the values only; the web provider and the native provider each hand the word on to their HeroUI part.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2).
 */

/** The screen edges a toast region can sit against. Verified against `ToastVariants` of `@heroui/styles` 3.2.6 and `ToastPlacement` of `heroui-native` 1.0.10. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the positions carry no labels.
export const ToastPosition = Object.freeze(["top", "bottom"] as const);

/** One toast position. */
export type ToastPosition = (typeof ToastPosition)[number];
