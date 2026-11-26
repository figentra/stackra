/**
 * Stackra file contract:
 * Purpose: `renderList(structures, binary, painter, options)`, the command list in the Symfony shape: usage, then the
 *          visible commands under headings, each with its one-line description. A command's heading is its `group`,
 *          else its namespace (the part before the first `:`); commands with neither come first, then the headings
 *          `options.order` names in that order, then the other headings alphabetically, each heading's names in
 *          order. When `options.more` commands were left out, the last line says `<bin> list --all` shows them.
 * Boundary: pure; returns the lines (the banner is written separately).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-014; spec 030 Requirement 5.2; STA-1966 spec FR-015; STA-2872 spec FR-001 and
 *                     FR-003.
 */
import { LIST_ALL_FLAG } from "#core/constants/list-all-flag.constant";
import { LIST_COMMAND } from "#core/constants/list-command.constant";
import { padTo } from "#core/functions/pad-to.function";
import type { CommandListOptions } from "#contracts/types/command-list-options.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { Painter } from "#core/types/painter.type";

/** The heading a command sits under, or "" for none. */
const headingOf = (structure: CommandStructure) =>
  structure.group ?? (structure.name.includes(":") ? (structure.name.split(":")[0] ?? "") : "");

/**
 * The list lines of `structures`, run as `binary`, with the headings `options.order` names first in that order.
 *
 * @example
 * renderList(structures, "stackra", painter, { order: ["Create", "Develop"], more: 12 });
 */
export function renderList(
  structures: readonly CommandStructure[],
  binary: string,
  painter: Painter,
  options: CommandListOptions = {},
): string[] {
  const order = options.order ?? [];
  const more = options.more ?? 0;
  // No heading ranks first; a named heading by its place in `order`; any other heading after them.
  const rank = (heading: string) =>
    heading === "" ? -1 : order.includes(heading) ? order.indexOf(heading) : order.length;
  const visible = [...new Set(structures)]
    .filter((structure) => !structure.hidden)
    .toSorted(
      (a, b) =>
        rank(headingOf(a)) - rank(headingOf(b)) ||
        headingOf(a).localeCompare(headingOf(b)) ||
        a.name.localeCompare(b.name),
    );
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
    ...(more > 0
      ? [
          painter.dim(
            `  Run "${binary} ${LIST_COMMAND} ${LIST_ALL_FLAG}" for every command (${more} more).`,
          ),
        ]
      : []),
    "",
  );
  return lines;
}
