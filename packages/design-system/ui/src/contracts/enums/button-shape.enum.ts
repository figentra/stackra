/**
 * Stackra file contract:
 * Purpose: the button shapes: the theme's own corner (`default`) or a full pill (`pill`), for marketing surfaces
 *          that ask for pill buttons (STA-2016; Stackra landing, owner's Q2 of 2026-11-02).
 * Boundary: the values only; each Button renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7).
 */

/** The button shapes: `default` takes the theme's corner, `pill` is fully rounded. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the shapes carry no labels.
export const ButtonShape = Object.freeze(["default", "pill"] as const);

/** One button shape. */
export type ButtonShape = (typeof ButtonShape)[number];
