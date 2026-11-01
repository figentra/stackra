/**
 * Stackra file contract:
 * Purpose: `renderList(entries, binary, painter)`, the command list in the Symfony shape: usage, then the visible
 *          commands grouped by namespace (the part before the first `:`), each namespace and name in order.
 * Boundary: pure; returns the lines (the banner is written separately).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-014; spec 030 Requirement 5.2.
 */
import { padTo } from "#core/functions/pad-to.function";
import type { CommandEntry } from "#core/types/command-entry.type";
import type { Painter } from "#core/types/painter.type";

/** The list lines of `entries`, run as `binary`. */
export function renderList(
  entries: readonly CommandEntry[],
  binary: string,
  painter: Painter,
): string[] {
  const visible = [...new Set(entries)]
    .map((entry) => entry.structure)
    .filter((structure) => !structure.hidden)
    .toSorted((a, b) => {
      const [first, second] = [a.name.includes(":") ? 1 : 0, b.name.includes(":") ? 1 : 0];
      return first - second || a.name.localeCompare(b.name);
    });
  const width = Math.max(0, ...visible.map((structure) => structure.name.length)) + 2;
  const lines = [
    painter.warning("Usage:"),
    `  ${binary} <command> [options] [arguments]`,
    "",
    painter.warning("Available commands:"),
  ];
  let namespace: string | undefined;
  for (const structure of visible) {
    const current = structure.name.includes(":") ? structure.name.split(":")[0] : undefined;
    if (current !== undefined && current !== namespace) lines.push(` ${painter.warning(current)}`);
    namespace = current;
    lines.push(`  ${painter.success(padTo(structure.name, width))}${structure.description}`);
  }
  lines.push(
    "",
    painter.dim(`  Run "${binary} <command> --help" for a command's arguments and options.`),
    "",
  );
  return lines;
}
