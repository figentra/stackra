/**
 * Stackra file contract:
 * Purpose: `RestrictedTenderProgram`, one restricted tender a Market offers (EBT SNAP, a meal voucher): the rule set
 *          that decides which lines it may pay, whether its part of the basket is tax-free, whether it is captured at
 *          fulfilment against the picked basket, and whether the terminal asks for a PIN.
 * Boundary: a type in the leaf entry; pack data read through `RestrictedTenderPrograms` (the pack key
 *           `payments.restricted-tenders`), never written in code. The rule set is a key of `@stackra/rules`
 *           (`rule-set:<product>:tender-eligibility`).
 * Runtime: isomorphic
 * Governing contract: ADR 0445; R3-SO-08; GRO-182; GRO-186.
 */

/**
 * A program, from pack data.
 *
 * @example
 * const snap: RestrictedTenderProgram = { code: "snap", ruleSet: "rule-set:grocery:tender-eligibility", taxExempt: true, captureAtFulfilment: true, pinEntry: true };
 */
export interface RestrictedTenderProgram {
  /** The program code the pack lists (`snap`, `meal_voucher`). */
  readonly code: string;

  /** The rule set that decides line eligibility. */
  readonly ruleSet: string;

  /** No tax on the part of the eligible lines this tender pays (the pack's tax rule). */
  readonly taxExempt: boolean;

  /** Authorise at checkout and capture against the picked basket at delivery or pickup. */
  readonly captureAtFulfilment: boolean;

  /** The terminal or hosted PIN pad asks the customer for a PIN. */
  readonly pinEntry: boolean;
}
