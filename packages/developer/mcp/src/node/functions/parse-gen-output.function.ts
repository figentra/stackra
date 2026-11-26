/**
 * Stackra file contract:
 * Purpose: `parseGenOutput(output)`, the refusals and warnings in `stackra gen` output: each
 *          `<file>[:line:col] <error|warning> <code> <subject>: <message>` line (gen's `formatGenError`) with the
 *          `  fix: …` line under it.
 * Boundary: pure; reads text without colour codes.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 22: gen refuses with a code and a fix); STA-2873.
 */
import type { Diagnostic } from "#node/types/diagnostic.type";

/** `src/x.ts:4:3 error shape_number_kind Orders: message`, the place optional. */
const FINDING = /^(\S+?)(?::(\d+):(\d+))? (error|warning) ([a-z][a-z0-9_]*) (.+)$/;

/** `  fix: what to do`. */
const FIX = /^\s+fix: (.+)$/;

/**
 * The gen findings in `output`, in the order printed.
 *
 * @param output - `stackra gen` output without colour codes.
 * @example
 * parseGenOutput("src/a.ts:4:3 error shape_number_kind Orders: bad\n  fix: use Int\n")[0]?.fix; // "use Int"
 */
export function parseGenOutput(output: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  for (const line of output.split(/\r?\n/)) {
    const fix = FIX.exec(line);
    const last = found.at(-1);
    if (fix !== null && last !== undefined && last.fix === undefined) {
      found[found.length - 1] = { ...last, fix: fix[1] ?? "" };
      continue;
    }
    const finding = FINDING.exec(line);
    if (finding === null) continue;
    const [, file = "", row, column, severity, code = "", message = ""] = finding;
    found.push({
      file,
      ...(row === undefined ? {} : { line: Number(row), column: Number(column) }),
      severity: severity === "warning" ? "warning" : "error",
      code,
      message,
    });
  }
  return found;
}
