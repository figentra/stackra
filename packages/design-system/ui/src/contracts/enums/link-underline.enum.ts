/**
 * Stackra file contract:
 * Purpose: when a link shows its underline: `always`, the default and the only choice for a link inside running text
 *          (WCAG 1.4.1: the stackra link colour equals the text colour), or `hover`, for a standalone link whose place
 *          (a navigation list, a card footer) already says it is a link.
 * Boundary: the values only; each renderer maps them to its own class.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract); ADR 0060.
 */

/** The underline choices. On native, where nothing hovers, `hover` means no underline. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the choices carry no labels.
export const LinkUnderline = Object.freeze(["always", "hover"] as const);

/** One underline choice. */
export type LinkUnderline = (typeof LinkUnderline)[number];
