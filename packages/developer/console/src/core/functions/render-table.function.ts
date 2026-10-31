/**
 * Stackra file contract:
 * Purpose: `renderTable(headers, rows, options)`, a table with one rule under bold headers and columns padded by
 *          display width, so Arabic, CJK and emoji cells line up; right-to-left cells are isolated.
 * Boundary: pure; returns the lines.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018, FR-026 and SC-004.
 */
import { displayWidth } from "#core/functions/display-width.function";
import { isolateBidi } from "#core/functions/isolate-bidi.function";
import { padTo } from "#core/functions/pad-to.function";
import type { Painter } from "#core/types/painter.type";

/** The lines of a table. */
export function renderTable(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
  options: { readonly unicode: boolean; readonly painter: Painter },
): string[] {
  const cells = rows.map((row) => headers.map((_, index) => isolateBidi(String(row[index] ?? ""))));
  const widths = headers.map((header, index) =>
    Math.max(displayWidth(header), ...cells.map((row) => displayWidth(row[index] ?? ""))),
  );
  const line = (row: readonly string[]) =>
    `  ${row.map((cell, index) => padTo(cell, widths[index] ?? 0)).join("   ")}`.trimEnd();
  const rule = options.unicode ? "─" : "-";
  return [
    options.painter.bold(line(headers)),
    options.painter.dim(`  ${widths.map((width) => rule.repeat(width)).join("   ")}`),
    ...cells.map(line),
  ];
}
