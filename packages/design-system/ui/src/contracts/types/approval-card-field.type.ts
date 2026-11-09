/**
 * Stackra file contract:
 * Purpose: `ApprovalCardField`, one label and value of the input a tool call would run with, as an approval card
 *          lists it.
 * Boundary: types only; the value is already text, so the card formats nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0021 (a write waits for a person).
 */
/** One input field of the call a person approves. */
export interface ApprovalCardField {
  /** What the value is, for example "Order". */
  readonly label: string;
  /** The value as text, for example "2048". */
  readonly value: string;
}
