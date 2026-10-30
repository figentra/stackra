/**
 * Stackra file contract:
 * Purpose: `PasswordFieldMode`, what a PasswordField takes: a `password` of any characters, or a numeric `pin` typed on
 *          the number pad (POS staff switching).
 * Boundary: values only.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 3 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0303 (decision 7).
 */

// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the modes carry no labels.
/** The kinds of secret a password field can take. */
export const PasswordFieldMode = Object.freeze(["password", "pin"] as const);

/** One password field mode. */
export type PasswordFieldMode = (typeof PasswordFieldMode)[number];
