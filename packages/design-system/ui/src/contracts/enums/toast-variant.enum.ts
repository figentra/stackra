/**
 * Stackra file contract:
 * Purpose: the look of every toast in a region: `alert` (the card, the default), `bar` (a compact bar with the tone on
 *          its inline-start edge), `flip-bar` (the bar, flipping in) and `bubble` (a rounded bubble, made for a
 *          person's avatar).
 * Boundary: the values only; each `ToastProvider` draws them, and the flip plays only at the `full` motion level.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 2); ADR 0329 (motion layer).
 */

/** The toast looks. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the looks carry no labels.
export const ToastVariant = Object.freeze(["alert", "bar", "flip-bar", "bubble"] as const);

/** One toast look. */
export type ToastVariant = (typeof ToastVariant)[number];
