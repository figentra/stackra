/**
 * Stackra file contract:
 * Purpose: `importIssuesCsv`, the problems of an import's dry run as CSV text (row, field, problem), with a header row
 *          in the reader's language, so the ImportDialog can hand people the error list to fix in their spreadsheet.
 * Boundary: a pure function; the web dialog downloads the text, the native one shares it.
 * Runtime: isomorphic
 * Governing contract: RFC 4180 (CSV quoting); STA-1371.
 */
import type { ImportIssue } from "#contracts/types/import-issue.type";

/** A CSV cell: quoted when it holds a comma, a quote or a line break, with its quotes doubled. */
const cell = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** The issues as CSV, one per line after `header`, lines ending in CRLF. */
export function importIssuesCsv(
  issues: readonly ImportIssue[],
  header: readonly [row: string, field: string, message: string],
): string {
  return [header, ...issues.map((issue) => [issue.row, issue.field, issue.message])]
    .map((line) => line.map(cell).join(","))
    .join("\r\n");
}
