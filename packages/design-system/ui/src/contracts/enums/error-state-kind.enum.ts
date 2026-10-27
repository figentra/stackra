/**
 * Stackra file contract:
 * Purpose: `ErrorStateKind`, the kinds of failure an `ErrorState` stands for, which pick its default icon and are named
 *          on the element: `unauthenticated` (HTTP 401, the user must sign in), `forbidden` (403), `not-found` (404)
 *          and `unexpected` (anything else).
 * Boundary: the values only; an HTTP status is not a prop, the error's own code goes in the details the app passes.
 *           Not `@stackra/errors`' `ErrorKind` (the ten refusal kinds of ADR 0140): this is the four screens a user
 *           sees, so it has its own name (STA-1383).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); ADR 0140 (error envelope); STA-1383 (unique
 *                     public names).
 */

/** The error-state kinds, `unexpected` last as the catch-all. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the kinds carry no labels.
export const ErrorStateKind = Object.freeze([
  "unauthenticated",
  "forbidden",
  "not-found",
  "unexpected",
] as const);

/** One kind of failure screen. */
export type ErrorStateKind = (typeof ErrorStateKind)[number];
