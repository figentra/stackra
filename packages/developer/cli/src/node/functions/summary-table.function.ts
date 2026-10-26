/**
 * Stackra file contract:
 * Purpose: `summaryTable(rows)`, the table `stackra check` prints after its findings: phase, status, findings, fixable count
 *          and duration, padded into columns.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */

/**
 * The summary table text, one line per phase and a header.
 *
 * @param rows - each phase's name, status, finding and fixable counts, and duration in milliseconds.
 * @example
 * summaryTable([{ phase: "config", status: "passed", findings: 0, fixable: 0, ms: 12 }]);
 */
export function summaryTable(
  rows: readonly {
    readonly phase: string;
    readonly status: string;
    readonly findings: number;
    readonly fixable: number;
    readonly ms: number;
  }[],
): string {
  const cells = [
    ["phase", "status", "findings", "fixable", "duration"],
    ...rows.map((row) => [
      row.phase,
      row.status,
      String(row.findings),
      String(row.fixable),
      `${(row.ms / 1000).toFixed(1)}s`,
    ]),
  ];
  const widths =
    cells[0]?.map((_, column) => Math.max(...cells.map((row) => (row[column] ?? "").length))) ?? [];
  return `${cells
    .map((row) =>
      row
        .map((cell, column) => cell.padEnd(widths[column] ?? 0))
        .join("  ")
        .trimEnd(),
    )
    .join("\n")}\n`;
}
