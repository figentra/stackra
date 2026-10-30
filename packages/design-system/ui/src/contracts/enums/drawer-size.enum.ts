/**
 * Stackra file contract:
 * Purpose: the widths of a side drawer: `sm` (400 px), `md` (560 px, the default), `lg` (720 px) and `full` (the
 *          viewport less its insets). A top or bottom drawer is always the full width less its insets.
 * Boundary: the values only; each runtime's `Drawer` maps them to its own lengths, capped to the screen.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); owner request 2026-10-29 (STA-1371, the floating drawer).
 */

/** The drawer sizes. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the sizes carry no labels.
export const DrawerSize = Object.freeze(["sm", "md", "lg", "full"] as const);

/** One drawer size. */
export type DrawerSize = (typeof DrawerSize)[number];
