/**
 * Stackra file contract:
 * Purpose: `checkReport(output)`, the findings part of a `check` or `verify` tool result: each finding of the JSON
 *          report (`parseCheckOutput`) as a diagnostic (`checkDiagnostics`), and their counts by phase and severity;
 *          `report` false when the run printed no report.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); STA-2873; STA-2886.
 */
import type { Diagnostic } from "@stackra/console/contracts";

import { checkDiagnostics } from "#node/functions/check-diagnostics.function";
import { parseCheckOutput } from "#node/functions/parse-check-output.function";

/**
 * The report of a `--format=json` check run.
 *
 * @param output - the run's full plain output.
 * @example
 * checkReport("[]\n"); // { report: true, counts: {}, diagnostics: [] }
 */
export function checkReport(output: string): {
  readonly report: boolean;
  readonly counts: Readonly<Record<string, { readonly errors: number; readonly warnings: number }>>;
  readonly diagnostics: readonly Diagnostic[];
} {
  const findings = parseCheckOutput(output);
  const diagnostics = checkDiagnostics(findings ?? []);
  const counts: Record<string, { errors: number; warnings: number }> = {};
  for (const diagnostic of diagnostics) {
    const count = (counts[diagnostic.phase] ??= { errors: 0, warnings: 0 });
    if (diagnostic.severity === "warning") count.warnings += 1;
    else count.errors += 1;
  }
  return { report: findings !== undefined, counts, diagnostics };
}
