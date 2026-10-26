/**
 * Stackra file contract:
 * Purpose: `ProgressState`: what an indicator draws and says.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 4.1.2.
 */

/** What an indicator draws and says. Every field is `undefined` for an indeterminate one. */
export interface ProgressState {
  /** The fill from 0 to 100; `undefined` when the value is unknown. */
  readonly percentage: number | undefined;
  /** The spoken and shown text of the value, for example "40%". */
  readonly valueText: string | undefined;
  /** React Native's `accessibilityValue`: the range, the clamped value and its text. */
  readonly accessibilityValue:
    | { readonly min: number; readonly max: number; readonly now: number; readonly text: string }
    | undefined;
}
