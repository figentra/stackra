/**
 * Stackra file contract:
 * Purpose: `PercentValueContractProps`, the props of every runtime's `PercentValue`: a share (0.25 is 25%) written in
 *          the locale's percent form and the customer's digits.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192; STA-1371 (wave A).
 */

/** Props shared by the web and native `PercentValue`. */
export interface PercentValueContractProps {
  /** The share, where 1 is 100%. */
  readonly value: number;
  /** The most fraction digits; defaults to 0. */
  readonly fractionDigits?: number | undefined;
  /** True to always show the sign, for a change such as "+4%". */
  readonly showSign?: boolean | undefined;
}
