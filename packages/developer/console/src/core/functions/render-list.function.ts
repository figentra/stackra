/**
 * Stackra file contract:
 * Purpose: `renderList(structures, binary, painter)`, the command list in the Symfony shape: usage, then the visible
 *          commands under headings, each with its one-line description. A command's heading is its `group`, else
 *          its namespace (the part before the first `:`); commands with neither come first, then each heading in
 *          order, its names in order.
 * Boundary: pure; returns the lines (the banner is written separately).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-014; spec 030 Requirement 5.2; STA-1966 spec FR-015.
 */
import { padTo } from "#core/functions/pad-to.function";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { Painter } from "#core/types/painter.type";

/** The heading a command sits under, or "" for none. */
const headingOf = (structure: CommandStructure) =>
  structure.group ?? (structure.name.includes(":") ? (structure.name.split(":")[0] ?? "") : "");

/** The list lines of `structures`, run as `binary`. */
export function renderList(
  structures: readonly CommandStructure[],
  binary: string,
  painter: Painter,
): string[] {
  const visible = [...new Set(structures)]
    .filter((structure) => !structure.hidden)
    .toSorted((a, b) => headingOf(a).localeCompare(headingOf(b)) || a.name.localeCompare(b.name));
  const width = Math.max(0, ...visible.map((structure) => structure.name.length)) + 2;
  const lines = [
    painter.warning("Usage:"),
    `  ${binary} <command> [options] [arguments]`,
    "",
    painter.warning("Available commands:"),
  ];
  let heading = "";
  for (const structure of visible) {
    const current = headingOf(structure);
    if (current !== heading) lines.push(` ${painter.warning(current)}`);
    heading = current;
    lines.push(`  ${painter.success(padTo(structure.name, width))}${structure.description}`);
  }
  lines.push(
    "",
    painter.dim(`  Run "${binary} help <command>" for a command's arguments and options.`),
    "",
  );
  return lines;
}
