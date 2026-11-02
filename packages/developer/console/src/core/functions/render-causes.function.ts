/**
 * Stackra file contract:
 * Purpose: `renderCauses(error, painter)`, what `--verbose` adds under the error screen: the stack of `error` and of
 *          every `cause` below it, at most ten deep.
 * Boundary: pure; returns the lines. Never prints a prompt's answer (errors never carry one).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-019; STA-1966 spec FR-011.
 */
import type { Painter } from "#core/types/painter.type";

/** The stack and cause lines of `error`. */
export function renderCauses(error: unknown, painter: Painter): string[] {
  const lines: string[] = [];
  let current: unknown = error;
  let depth = 0;
  while (current instanceof Error && depth < 10) {
    if (depth > 0) lines.push("", `  ${painter.warning("Caused by:")} ${current.message}`);
    for (const frame of (current.stack ?? "").split("\n").slice(1))
      lines.push(painter.dim(`  ${frame.trim()}`));
    current = current.cause;
    depth += 1;
  }
  if (current !== undefined && !(current instanceof Error))
    lines.push("", `  ${painter.warning("Caused by:")} ${String(current)}`);
  return lines;
}
