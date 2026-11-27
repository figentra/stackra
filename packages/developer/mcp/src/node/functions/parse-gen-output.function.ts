/**
 * Stackra file contract:
 * Purpose: `parseGenOutput(output)`, the refusals and warnings in `stackra gen` output, each a `Diagnostic` of phase
 *          `gen`: each `<file>[:line:col] <error|warning> <code> <subject>: <message>` line (gen's `formatGenError`)
 *          with the `  fix: …` line under it and, where gen prints one, the `  docs: <url> (stackra explain <code>)`
 *          line, whose link becomes the finding's `docsUrl`.
 * Boundary: pure; reads text without colour codes. A docs line is read only right under its finding.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 22: gen refuses with a code and a fix); STA-2873; STA-2891 (gen's docs line);
 *                     STA-2886.
 */
import type { Diagnostic } from "@stackra/console/contracts";

/** `src/x.ts:4:3 error shape_number_kind Orders: message`, the place optional. */
const FINDING = /^(\S+?)(?::(\d+):(\d+))? (error|warning) ([a-z][a-z0-9_]*) (.+)$/;

/** `  fix: what to do`. */
const FIX = /^\s+fix: (.+)$/;

/** `  docs: https://… (stackra explain shape_number_kind)`. */
const DOCS = /^\s+docs: (\S+)/;

/**
 * The gen findings in `output`, in the order printed.
 *
 * @param output - `stackra gen` output without colour codes.
 * @example
 * parseGenOutput("src/a.ts:4:3 error shape_number_kind Orders: bad\n  fix: use Int\n")[0]?.fix; // "use Int"
 */
export function parseGenOutput(output: string): Diagnostic[] {
  const found: Diagnostic[] = [];
  // The finding the next fix or docs line belongs to; any other line ends it.
  let open = false;
  for (const line of output.split(/\r?\n/)) {
    const last = found.at(-1);
    const fix = open ? FIX.exec(line) : null;
    if (fix !== null && last !== undefined && last.fix === undefined) {
      found[found.length - 1] = { ...last, fix: fix[1] ?? "" };
      continue;
    }
    const docs = open ? DOCS.exec(line) : null;
    if (docs !== null && last !== undefined && last.docsUrl === undefined) {
      found[found.length - 1] = { ...last, docsUrl: docs[1] ?? "" };
      continue;
    }
    const finding = FINDING.exec(line);
    open = finding !== null;
    if (finding === null) continue;
    const [, file = "", row, column, severity, code = "", message = ""] = finding;
    found.push({
      phase: "gen",
      code,
      severity: severity === "warning" ? "warning" : "error",
      file,
      ...(row === undefined ? {} : { line: Number(row), column: Number(column) }),
      message,
    });
  }
  return found;
}
