/**
 * Stackra file contract:
 * Purpose: `chartCsvOf`, a widget's data as CSV text (RFC 4180): a header row, then one line per row, numbers as
 *          plain digits so a spreadsheet reads them as numbers.
 * Boundary: pure. A text cell that starts like a formula (`=`, `+`, `-`, `@`, tab or return) is prefixed with `'`, so a
 *           spreadsheet never runs a label as a formula (CSV injection); numbers are left as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 to 18); RFC 4180; OWASP CSV injection; STA-1371.
 */
import type { WidgetData } from "#contracts/types/widget-data.type";

/** One cell, quoted when it holds a comma, a quote or a line break. */
function cellOf(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * The CSV text of `data`, lines ended by CRLF.
 * @example chartCsvOf({ head: ["Month", "Sales"], rows: [["Jan", 1200]] }); // "Month,Sales\r\nJan,1200\r\n"
 */
export function chartCsvOf(data: WidgetData): string {
  return [data.head, ...data.rows].map((row) => `${row.map(cellOf).join(",")}\r\n`).join("");
}
