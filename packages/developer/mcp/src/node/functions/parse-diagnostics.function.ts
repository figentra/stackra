/**
 * Stackra file contract:
 * Purpose: `parseDiagnostics(output, phase)`, the compiler and linter findings in a command's plain output, each a
 *          `Diagnostic` of `phase`: TypeScript's
 *          `file(line,col): error TS…: …` and pretty `file:line:col - error TS…: …` lines, and oxlint's
 *          `x rule(name): message` (`!` a warning; `×` and `⚠` on a terminal) with the `[file:line:col]` line under it.
 *          A Turborepo task prefix before a line is allowed. Each finding is reported once.
 * Boundary: pure; reads text without colour codes and never guesses a place the tool did not print.
 * Runtime: node
 * Governing contract: STA-2873; STA-2886 (the one `Diagnostic` shape).
 */
import type { Diagnostic } from "@stackra/console/contracts";

/** `src/a.ts(2,14): error TS2322: Type …`. */
const TSC = /(?:^|\s)([^\s()]+)\((\d+),(\d+)\): (error|warning) (TS\d+): (.+)$/;

/** `src/a.ts:2:14 - error TS2322: Type …` (tsc --pretty). */
const TSC_PRETTY = /(?:^|\s)([^\s:]+):(\d+):(\d+) - (error|warning) (TS\d+): (.+)$/;

/** `  x eslint(no-debugger): message` (oxlint); `!` or `⚠` is a warning, `x` or `×` an error. */
const OXLINT_HEAD = /(?:^|\s)([x×!⚠])\s+([\w@/-]+\([\w@/-]+\)):\s+(.+)$/;

/** `   ,-[src/a.ts:3:1]` or `   ╭─[src/a.ts:3:1]`, the place of the oxlint finding above it. */
const OXLINT_PLACE = /[,╭]─?-?\[(.+?):(\d+):(\d+)\]/;

/**
 * The findings in `output`, in the order printed.
 *
 * @param output - a command's output without colour codes.
 * @param phase - the tool that printed it (`typecheck`, `lint`), each finding's `phase`.
 * @example
 * parseDiagnostics("src/a.ts(2,14): error TS2322: Bad\n", "typecheck")[0]?.code; // "TS2322"
 */
export function parseDiagnostics(output: string, phase: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  const seen = new Set<string>();
  const add = (diagnostic: Diagnostic): void => {
    const key = JSON.stringify(diagnostic);
    if (seen.has(key)) return;
    seen.add(key);
    found.push(diagnostic);
  };
  let pending: Omit<Diagnostic, "file" | "phase"> | undefined;
  for (const line of output.split(/\r?\n/)) {
    const tsc = TSC.exec(line) ?? TSC_PRETTY.exec(line);
    if (tsc !== null) {
      const [, file = "", row, column, severity, code, message = ""] = tsc;
      add({
        phase,
        file,
        line: Number(row),
        column: Number(column),
        severity: severity === "warning" ? "warning" : "error",
        ...(code === undefined ? {} : { code }),
        message,
      });
      pending = undefined;
      continue;
    }
    const head = OXLINT_HEAD.exec(line);
    if (head !== null) {
      const [, mark, code, message = ""] = head;
      pending = {
        severity: mark === "!" || mark === "⚠" ? "warning" : "error",
        ...(code === undefined ? {} : { code }),
        message,
      };
      continue;
    }
    const place = pending === undefined ? null : OXLINT_PLACE.exec(line);
    if (place !== null && pending !== undefined) {
      const [, file = "", row, column] = place;
      add({ phase, file, line: Number(row), column: Number(column), ...pending });
      pending = undefined;
    }
  }
  return found;
}
