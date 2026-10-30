/**
 * Stackra file contract:
 * Purpose: `chartTextOf`, a `ChartTable` as one sentence a screen reader speaks after the chart's name: each row's
 *          category, then its values (each after its series' label when there are several columns).
 * Boundary: pure; punctuation only, no words of its own (the Arabic comma in Arabic).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0192 (digits); ADR 0060 (Arabic); STA-1371.
 */
import type { ChartTable } from "#contracts/types/chart-table.type";
import { isArabic } from "#core/functions/is-arabic.function";

/**
 * The table read aloud.
 * @example chartTextOf({ head: ["", "Desktop", "Mobile"], rows: [["Jan", "186", "80"]] }, "en"); // "Jan: Desktop 186, Mobile 80"
 */
export function chartTextOf(table: ChartTable, locale: string): string {
  const comma = isArabic(locale) ? "، " : ", ";
  const isLabelled = table.head.length > 2;
  return table.rows
    .map(([category = "", ...values]) => {
      const spoken = values
        .map((value, index) => (isLabelled ? `${table.head[index + 1] ?? ""} ${value}` : value))
        .join(comma);
      return `${category}: ${spoken}`;
    })
    .join("; ");
}
