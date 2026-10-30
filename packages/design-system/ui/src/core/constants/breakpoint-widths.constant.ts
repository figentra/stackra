/**
 * Stackra file contract:
 * Purpose: `BREAKPOINT_WIDTHS`, the minimum width of each layout breakpoint, in CSS pixels on web and points on
 *          native: Tailwind's `sm` 640, `md` 768, `lg` 1024, `xl` 1280, which the web classes already use.
 * Boundary: data only; read by `breakpointStateOf`, so a hook and a `md:` class agree on where a layout changes.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0317.
 */
import type { LayoutBreakpoint } from "#contracts/enums/layout-breakpoint.enum";

// shortcut: Tailwind's default widths, written once here; read the theme's `--breakpoint-*` when a theme changes them.
/** The minimum width of each breakpoint. */
export const BREAKPOINT_WIDTHS: Readonly<Record<LayoutBreakpoint, number>> = Object.freeze({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
});
