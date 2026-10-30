/**
 * Stackra file contract:
 * Purpose: `chartAnnotationTextOf`, an annotation as words a screen reader reads after the chart's data table:
 *          "Launch: Mar 2026".
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import type { ChartAnnotation } from "#contracts/types/chart-annotation.type";
import { formatChartCategory } from "#core/functions/format-chart-category.function";

/**
 * The words of one annotation.
 * @example chartAnnotationTextOf({ at: "Mar", label: "Launch" }, "en"); // "Launch: Mar"
 */
export function chartAnnotationTextOf(
  annotation: ChartAnnotation,
  locale: string,
  categoryFormat?: Intl.DateTimeFormatOptions,
): string {
  return `${annotation.label}: ${formatChartCategory(annotation.at, locale, categoryFormat)}`;
}
