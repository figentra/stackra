/**
 * Stackra file contract:
 * Purpose: the widths at which a page frame changes shape, named as Tailwind names them so the web components map a
 *          value to a static `sm:`, `md:`, `lg:` or `xl:` class: `sm` 640 px, `md` 768 px, `lg` 1024 px, `xl` 1280 px.
 *          AppShell turns its sidebar into a drawer below one, and TwoColumnLayout stacks its side column below one.
 * Boundary: the values only; the widths are the theme's breakpoints, so this enum never holds a pixel number.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317.
 */

/** The layout breakpoints. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the breakpoints carry no labels.
export const LayoutBreakpoint = Object.freeze(["sm", "md", "lg", "xl"] as const);

/** One layout breakpoint. */
export type LayoutBreakpoint = (typeof LayoutBreakpoint)[number];
