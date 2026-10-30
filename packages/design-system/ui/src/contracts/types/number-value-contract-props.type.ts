/**
 * Stackra file contract:
 * Purpose: `NumberValueContractProps`, the props of every runtime's `NumberValue`: a number written in the provider's
 *          locale and the customer's digits (Latin or Arabic-Indic), with any `Intl.NumberFormat` options.
 * Boundary: types only; display, not input (use NumberField to edit).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `NumberValue`. */
export interface NumberValueContractProps {
  /** The number. */
  readonly value: number;
  /** How it is written: grouping, fraction digits, compact notation, a unit. */
  readonly options?: Intl.NumberFormatOptions | undefined;
}
