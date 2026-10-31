/**
 * Stackra file contract:
 * Purpose: `PromptChoice`, one choice of a `select`, `multiselect` or `search` prompt.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */

/** A choice: the value returned and the label shown. */
export interface PromptChoice {
  /** What the prompt returns. */
  readonly value: string;

  /** What the Operator sees; the value when absent. */
  readonly label?: string;

  /** A dim line beside the label. */
  readonly hint?: string;
}
