/**
 * Stackra file contract:
 * Purpose: `FlooredParam`, one outcome parameter the floor guard lifted: the outcome kind and parameter, the value the
 *          rule asked for, the floor value it got instead, and the law, market and pack version that set the floor.
 * Boundary: a type only. It names the law so the admin can say "required by law" beside the value; it carries no fact.
 * Runtime: isomorphic
 * Governing contract: config-model sections 3 and 4 (floors, provenance); ADR 0370 (decision 6).
 */

/** One lifted parameter. */
export interface FlooredParam {
  /** The outcome kind's key. */
  readonly kind: string;

  /** The parameter's key. */
  readonly param: string;

  /** The value the rule set. */
  readonly from: number;

  /** The floor value it was lifted (or lowered) to. */
  readonly to: number;

  /** The law the pack names for the floor. */
  readonly law: string;

  /** The market whose pack set the floor. */
  readonly market: string;

  /** That pack's version. */
  readonly version: string;
}
