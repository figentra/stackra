/**
 * Stackra file contract:
 * Purpose: `renderTable(table, options)`, a table with one rule under bold headers and columns padded by display width,
 *          so Arabic, CJK and emoji cells line up: status cells as symbol and word in colour, counts right-aligned,
 *          rows grouped under headings when `groupBy` is set, and the widest text column cut with `…` to fit the
 *          width (status and command cells are never cut).
 * Boundary: pure; returns the lines.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018, FR-026 and SC-004; STA-1966 spec FR-008.
 */
import type { CheckStatus } from "#contracts/types/check-status.type";
import type { TableSpec } from "#contracts/types/table-spec.type";
import { displayWidth } from "#core/functions/display-width.function";
import { padTo } from "#core/functions/pad-to.function";
import { statusCell } from "#core/functions/status-cell.function";
import { truncateTo } from "#core/functions/truncate-to.function";
import type { Painter } from "#core/types/painter.type";

/** The statuses a status cell draws; any other value is drawn as text. */
const STATUSES = new Set<unknown>(["ok", "warn", "fail", "skip", "info"]);

/** Space between columns. */
const GAP = "   ";

/** The lines of a table. */
export function renderTable(
  table: TableSpec,
  options: {
    readonly unicode: boolean;
    readonly painter: Painter;
    readonly columns: number;
    readonly bidi?: (text: string) => string;
  },
): string[] {
  const { painter } = options;
  const bidi = options.bidi ?? String;
  const plain = (value: unknown) =>
    value === undefined || value === null ? "" : bidi(String(value));
  const cell = (row: Readonly<Record<string, unknown>>, index: number): string => {
    const column = table.columns[index];
    const value = column === undefined ? undefined : row[column.key];
    return column?.kind === "status" && STATUSES.has(value)
      ? statusCell(value as CheckStatus, painter, options.unicode)
      : plain(value);
  };
  const cells = table.rows.map((row) => table.columns.map((_, index) => cell(row, index)));
  const widths = table.columns.map((column, index) =>
    Math.max(displayWidth(column.header), ...cells.map((row) => displayWidth(row[index] ?? ""))),
  );
  // Fit the width: shrink the widest text column, never a status, command or count.
  const room = options.columns - 2 - GAP.length * Math.max(0, widths.length - 1);
  const overflow = widths.reduce((sum, width) => sum + width, 0) - room;
  if (overflow > 0) {
    let widest = -1;
    for (const [index, column] of table.columns.entries())
      if (
        (column.kind ?? "text") === "text" &&
        (widest < 0 || (widths[index] ?? 0) > (widths[widest] ?? 0))
      )
        widest = index;
    if (widest >= 0) {
      const target = Math.max(
        displayWidth(table.columns[widest]?.header ?? ""),
        (widths[widest] ?? 0) - overflow,
        8,
      );
      widths[widest] = target;
      for (const row of cells) row[widest] = truncateTo(row[widest] ?? "", target);
    }
  }
  const line = (row: readonly string[]) =>
    `  ${row
      .map((text, index) => {
        const column = table.columns[index];
        const right =
          column?.align === "right" || (column?.align === undefined && column?.kind === "count");
        return padTo(text, widths[index] ?? 0, right ? "end" : "start");
      })
      .join(GAP)}`.trimEnd();
  const rule = options.unicode ? "─" : "-";
  const lines = [
    ...(table.title === undefined ? [] : [painter.bold(painter.accent(`  ${table.title}`)), ""]),
    painter.bold(line(table.columns.map((column) => column.header))),
    painter.dim(`  ${widths.map((width) => rule.repeat(width)).join(GAP)}`),
  ];
  if (table.groupBy === undefined) return [...lines, ...cells.map(line)];
  const groups = new Map<string, string[][]>();
  for (const [index, row] of table.rows.entries()) {
    const key = plain(row[table.groupBy]);
    groups.set(key, [...(groups.get(key) ?? []), cells[index] ?? []]);
  }
  for (const [heading, rows] of groups)
    lines.push(` ${painter.warning(heading)}`, ...rows.map(line));
  return lines;
}
