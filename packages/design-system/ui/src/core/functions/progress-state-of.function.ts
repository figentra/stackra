/**
 * Stackra file contract:
 * Purpose: works out what a native progress indicator draws and says from its props: the value held to its range, the
 *          fill as a percentage, the spoken text and the accessibility value. React Aria does the same on web, so this
 *          matches its rules: out-of-range values are clamped, an empty range is 0 per cent, and the default text is the
 *          percentage in the reader's locale.
 * Boundary: pure function; no React and no native imports.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 4.1.2.
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

/** The inputs of {@link progressStateOf}. */
export interface ProgressStateInput {
  /** The value, or `undefined` for an indeterminate indicator. */
  readonly value: number | undefined;
  /** The value that means nothing done. */
  readonly minValue: number;
  /** The value that means done. */
  readonly maxValue: number;
  /** The caller's own text for the value, used in place of the percentage. */
  readonly valueLabel: string | undefined;
  /** The BCP 47 locale the percentage is written in. */
  readonly locale: string;
}

/**
 * The state of one progress indicator.
 * @param input - the value, its range, the caller's text and the locale
 * @returns the fill, the text and the accessibility value; all `undefined` while the value is unknown
 */
export function progressStateOf({
  value,
  minValue,
  maxValue,
  valueLabel,
  locale,
}: ProgressStateInput): ProgressState {
  if (value === undefined)
    return { percentage: undefined, valueText: undefined, accessibilityValue: undefined };
  const now = Math.min(Math.max(value, minValue), maxValue);
  const range = maxValue - minValue;
  const percentage = range > 0 ? ((now - minValue) / range) * 100 : 0;
  const valueText =
    valueLabel ?? new Intl.NumberFormat(locale, { style: "percent" }).format(percentage / 100);
  return {
    percentage,
    valueText,
    accessibilityValue: { min: minValue, max: maxValue, now, text: valueText },
  };
}
