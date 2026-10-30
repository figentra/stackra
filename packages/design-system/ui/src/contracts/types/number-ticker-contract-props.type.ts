/**
 * Stackra file contract:
 * Purpose: `NumberTickerContractProps`, the props of `NumberTicker` on every runtime: a number that counts to its
 *          value, written in the provider's locale and digits.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0302 (decision 3); ADR 0329 (motion layer).
 */

/** Props of `NumberTicker`. */
export interface NumberTickerContractProps {
  /** The number to show; a change counts from the number on screen to the new one. */
  readonly value: number;
  /** The number the first count starts from. Defaults to 0. */
  readonly from?: number | undefined;
  /** How long a count takes, in milliseconds. Defaults to 900. */
  readonly duration?: number | undefined;
  /** How the number is written (`Intl.NumberFormat` options), for example a currency or a fixed number of decimals. */
  readonly format?: Intl.NumberFormatOptions | undefined;
}
