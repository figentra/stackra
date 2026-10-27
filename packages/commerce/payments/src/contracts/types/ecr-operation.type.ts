/**
 * Stackra file contract:
 * Purpose: `EcrOperation`, the operations a till asks a semi-integrated terminal for.
 * Boundary: a type in the leaf entry; what each one is called on the wire is the provider's `EcrProfile` (pack data).
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1 and 9).
 */

/** What the till asks the terminal to do. */
export type EcrOperation =
  | "sale"
  | "authorize"
  | "completion"
  | "void"
  | "refund"
  | "inquiry"
  | "cancel";
