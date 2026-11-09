/**
 * Stackra file contract:
 * Purpose: `ApprovalCardStatus`, where one tool call that waits for a person stands: requested (Approve and Deny),
 *          approved, denied or expired.
 * Boundary: the values only; the spoken words live in the catalogue (`ui::tamo.*`).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0021 (a write waits for a person).
 */
/** The states of an approval card. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128).
export const ApprovalCardStatus = Object.freeze([
  "requested",
  "approved",
  "denied",
  "expired",
] as const);

/** One state of an approval card. */
export type ApprovalCardStatus = (typeof ApprovalCardStatus)[number];
