/**
 * Stackra file contract:
 * Purpose: `checkReport(output)`, the findings part of a `check` or `verify` tool result: the findings of the JSON
 *          report (`parseCheckOutput`) and their counts by phase and severity; `findings` null when the run printed no
 *          report.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); STA-2873.
 */
import { parseCheckOutput } from "#node/functions/parse-check-output.function";

/**
 * The report of a `--format=json` check run.
 *
 * @param output - the run's full plain output.
 * @example
 * checkReport("[]\n"); // { findings: [], counts: {} }
 */
export function checkReport(output: string): {
  readonly findings: readonly Record<string, unknown>[] | null;
  readonly counts: Readonly<Record<string, { readonly errors: number; readonly warnings: number }>>;
} {
  const findings = parseCheckOutput(output);
  const counts: Record<string, { errors: number; warnings: number }> = {};
  for (const finding of findings ?? []) {
    const phase = typeof finding["phase"] === "string" ? finding["phase"] : "unknown";
    const count = (counts[phase] ??= { errors: 0, warnings: 0 });
    if (finding["severity"] === "warning") count.warnings += 1;
    else count.errors += 1;
  }
  return { findings: findings ?? null, counts };
}
