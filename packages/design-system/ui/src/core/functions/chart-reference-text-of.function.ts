/**
 * Stackra file contract:
 * Purpose: `chartReferenceTextOf`, a reference line or band as words a screen reader reads after the chart's data
 *          table: "Target: 5,000", "Healthy range: 100–200".
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import type { ChartReference } from "#contracts/types/chart-reference.type";
import { formatChartNumber } from "#core/functions/format-chart-number.function";

/**
 * The words of one reference.
 * @example chartReferenceTextOf({ value: 5000, label: "Target" }, "en"); // "Target: 5,000"
 */
export function chartReferenceTextOf(
  reference: ChartReference,
  locale: string,
  valueFormat?: Intl.NumberFormatOptions,
): string {
  const number = (value: number) => formatChartNumber(value, locale, valueFormat);
  const span =
    reference.value !== undefined
      ? number(reference.value)
      : `${number(reference.from ?? 0)}–${number(reference.to ?? 0)}`;
  return reference.label ? `${reference.label}: ${span}` : span;
}
