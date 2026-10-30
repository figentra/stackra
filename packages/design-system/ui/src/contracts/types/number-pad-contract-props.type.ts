/**
 * Stackra file contract:
 * Purpose: the props every runtime's `NumberPad` takes: a 3 by 4 keypad (a POS amount, a quantity, a PIN) that edits a string of Latin digits, with a decimal key, a delete key, and a PIN mode that masks the digits and reports the full code.
 * Boundary: types only. The keys keep the phone keypad's left-to-right order and Latin digits in every locale, as POS
 *           terminals do; the value is Latin digits and at most one `.`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
/** Props shared by the web and native `NumberPad`. */
export interface NumberPadContractProps {
  /** The digits typed, for a controlled pad; pair it with `onChange`. */
  readonly value?: string | undefined;
  /** The digits at the start, for an uncontrolled pad. */
  readonly defaultValue?: string | undefined;
  /** Called with the new value on every key. */
  readonly onChange?: ((value: string) => void) | undefined;
  /** The most characters the value takes. In PIN mode it is the code's length and defaults to 4. */
  readonly maxLength?: number | undefined;
  /** True for a PIN: the display shows dots, the decimal key is gone, and `onComplete` fires at full length. */
  readonly isPin?: boolean | undefined;
  /** Called with the value once it reaches `maxLength`. */
  readonly onComplete?: ((value: string) => void) | undefined;
  /** True to offer the decimal key (amounts); it types one separator at most. */
  readonly hasDecimal?: boolean | undefined;
  /** The spoken name of the pad and its display, for example "Amount" or "Staff PIN". */
  readonly label: string;
  /** The delete key's accessible name. Defaults to the catalogue's "Delete". */
  readonly deleteLabel?: string | undefined;
  /** True to hide the display row, when the value shows elsewhere. */
  readonly isDisplayHidden?: boolean | undefined;
  /** True to refuse every key. */
  readonly isDisabled?: boolean | undefined;
}
