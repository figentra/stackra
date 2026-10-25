/**
 * Stackra file contract:
 * Purpose: `RedactionRule`, one pattern of text that never reaches a model (contact details, document numbers, card
 *          numbers) and what replaces it.
 * Boundary: a type only. The patterns are data: a market pack holds its document-number and phone formats, the
 *           platform floor the rest; none is a constant in code. A rule's pattern is trusted platform data, never
 *           tenant or request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 15: the redaction of contact details, document numbers and card numbers
 *                     stays); OS-315.
 */

/** One redaction. */
export interface RedactionRule {
  /** The rule's name, also the default replacement (`[card_number]`). */
  readonly name: string;

  /** The regular expression source. */
  readonly pattern: string;

  /** Extra flags (`i`, `u`); `g` is always applied. */
  readonly flags?: string;

  /** The replacement text; `[<name>]` when absent. */
  readonly replacement?: string;
}
