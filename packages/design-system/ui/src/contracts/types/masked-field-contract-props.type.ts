/**
 * Stackra file contract:
 * Purpose: `MaskedFieldContractProps`, the props every runtime's `MaskedField` takes: a text field that writes what is
 *          typed into a pattern (a phone number, an IBAN, a card number, a date, a plate) while the value stays raw.
 * Boundary: types only; the value and `onChange` carry the raw characters, without the pattern's separators.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0192 (digits setting); STA-1371 (wave
 *          C, owner request 2026-10-29).
 */
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";

/** Props shared by the web and native `MaskedField`. */
export interface MaskedFieldContractProps extends Omit<TextFieldContractProps, "type"> {
  /**
   * The pattern: `9` takes a digit, `a` a letter, `A` a letter written upper case, `*` a letter or digit, and every
   * other character is written as is, for example `999 999 9999` or `AA99 9999 9999 9999 9999 9999`. Digits show in
   * the customer's digits and are read in Latin or Arabic-Indic.
   */
  readonly mask: string;
}
