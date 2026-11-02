/**
 * Stackra file contract:
 * Purpose: `renderChecklist(checklist, options)`, grouped status rows (`✓ ok  node  v24.11.0`) with each fix on its own
 *          line under its row, then the summary line ("7 passed · 1 warning · 1 error") in the colour of the worst row;
 *          returns the lines and the counts.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-009.
 */
import type { ChecklistSpec } from "#contracts/types/checklist-spec.type";
import type { ChecklistSummary } from "#contracts/types/checklist-summary.type";
import { displayWidth } from "#core/functions/display-width.function";
import { padTo } from "#core/functions/pad-to.function";
import { statusCell } from "#core/functions/status-cell.function";
import type { Painter } from "#core/types/painter.type";

/** `count` and its noun, plural when it is not 1. */
const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** The lines and counts of a checklist. */
export function renderChecklist(
  checklist: ChecklistSpec,
  options: {
    readonly unicode: boolean;
    readonly painter: Painter;
    readonly bidi?: (text: string) => string;
  },
): { readonly lines: string[]; readonly summary: ChecklistSummary } {
  const { painter, unicode } = options;
  const bidi = options.bidi ?? String;
  const groups = new Map<string, (typeof checklist.rows)[number][]>();
  for (const name of checklist.groups ?? []) groups.set(name, []);
  for (const row of checklist.rows)
    groups.set(row.group ?? "", [...(groups.get(row.group ?? "") ?? []), row]);
  const nameWidth = Math.max(0, ...checklist.rows.map((row) => displayWidth(bidi(row.name))));
  // The widest status cell (`✗ fail`) is 6 columns in both symbol sets.
  const lines =
    checklist.title === undefined ? [] : [painter.bold(painter.accent(`  ${checklist.title}`)), ""];
  for (const [heading, rows] of groups) {
    if (rows.length === 0) continue;
    if (heading !== "") lines.push(` ${painter.warning(heading)}`);
    for (const row of rows) {
      const detail = row.detail === undefined ? "" : bidi(row.detail);
      lines.push(
        `  ${padTo(statusCell(row.status, painter, unicode), 6)}  ${padTo(bidi(row.name), nameWidth)}  ${detail}`.trimEnd(),
      );
      if (row.fix !== undefined)
        lines.push(
          `  ${" ".repeat(6 + 2 + nameWidth + 2)}${painter.dim("fix:")} ${painter.bold(row.fix)}`,
        );
    }
  }
  const summary: ChecklistSummary = {
    passed: checklist.rows.filter((row) => row.status === "ok").length,
    warnings: checklist.rows.filter((row) => row.status === "warn").length,
    failed: checklist.rows.filter((row) => row.status === "fail").length,
    other: checklist.rows.filter((row) => row.status === "skip" || row.status === "info").length,
  };
  const paint =
    summary.failed > 0 ? painter.error : summary.warnings > 0 ? painter.warning : painter.success;
  const dot = unicode ? " · " : " - ";
  lines.push(
    "",
    `  ${paint(
      [
        `${summary.passed} passed`,
        counted(summary.warnings, "warning"),
        counted(summary.failed, "error"),
      ].join(dot),
    )}`,
  );
  return { lines, summary };
}
