/**
 * Stackra file contract:
 * Purpose: `renderError(error, verbose, painter, inverse)`, the error screen: a red ` ERROR ` badge with the message,
 *          the hint of a `UsageError`, and with `--verbose` the stack and every `cause` below it.
 * Boundary: pure; returns the lines. Never prints a prompt's answer (errors never carry one).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-019.
 */
import { UsageError } from "#core/errors/usage.error";
import type { Painter } from "#core/types/painter.type";

/** The lines of the error screen of `error`. */
export function renderError(
  error: unknown,
  verbose: boolean,
  painter: Painter,
  inverse: boolean,
): string[] {
  const message = error instanceof Error ? error.message : String(error);
  const badge = inverse
    ? painter.error(`\u001B[7m ERROR \u001B[27m`)
    : painter.bold(painter.error("ERROR"));
  const lines = ["", `  ${badge} ${message}`];
  if (error instanceof UsageError && error.hint !== undefined)
    lines.push("", `  ${painter.dim(error.hint)}`);
  if (verbose) {
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
  }
  lines.push("");
  return lines;
}
