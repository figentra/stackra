/**
 * Stackra file contract:
 * Purpose: `renderProblem(problem, options)`, the one error screen: a box titled ERROR in the error colour holding
 *          what failed, then why, a hint, the exact fix command and the docs link, each on its own labelled line;
 *          with `verbose`, the stack and causes and the raw detail under the box, dimmed.
 * Boundary: pure; returns the lines. Never prints a prompt's answer (a problem never carries one).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-019; STA-1966 spec FR-011.
 */
import type { Problem } from "#contracts/types/problem.type";
import { renderBox } from "#core/functions/render-box.function";
import { renderCauses } from "#core/functions/render-causes.function";
import type { Painter } from "#core/types/painter.type";

/** The lines of the error screen of `problem`. */
export function renderProblem(
  problem: Problem,
  options: {
    readonly unicode: boolean;
    readonly painter: Painter;
    readonly width: number;
    readonly verbose: boolean;
  },
): string[] {
  const { painter } = options;
  const label = (name: string) => painter.dim(name.padEnd(5));
  const body = [
    painter.bold(problem.title),
    ...(problem.why === undefined ? [] : [`${label("Why")} ${problem.why}`]),
    ...(problem.hint === undefined ? [] : [`${label("Hint")} ${problem.hint}`]),
    ...(problem.fix === undefined ? [] : [`${label("Fix")} ${painter.accent(problem.fix)}`]),
    ...(problem.docs === undefined ? [] : [`${label("Docs")} ${problem.docs}`]),
  ];
  const lines = [
    "",
    ...renderBox(body.join("\n"), {
      title: "ERROR",
      unicode: options.unicode,
      paint: painter.error,
      width: options.width,
    }).map((line) => `  ${line}`),
  ];
  if (options.verbose) {
    if (problem.error !== undefined) lines.push(...renderCauses(problem.error, painter));
    if (problem.detail !== undefined && problem.detail.trim() !== "")
      lines.push(
        "",
        ...problem.detail
          .trimEnd()
          .split("\n")
          .map((line) => painter.dim(`  │ ${line}`)),
      );
  }
  lines.push("");
  return lines;
}
