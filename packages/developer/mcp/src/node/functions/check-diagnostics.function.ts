/**
 * Stackra file contract:
 * Purpose: `checkDiagnostics(findings)`, the findings of a `stackra check --format=json` report as diagnostics: the
 *          finding's phase, its code as the check prints it and `stackra explain` takes it (`<tool>/<rule>`), its
 *          severity, path, line and column, message, and `stackra check --fix` as the fix when the check can repair it.
 * Boundary: pure; a finding about the whole repository (path `.`) has no file, and a `null` line or column is left out.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check); STA-2891 (`<tool>/<rule>` in explain);
 *                     STA-2886.
 */
import type { Diagnostic } from "@stackra/console/contracts";

/** A JSON field as a string, or undefined. */
const text = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/** A JSON field as a positive whole number, or undefined. */
const place = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;

/**
 * The diagnostics of `findings`.
 *
 * @param findings - the report's findings, as JSON objects.
 * @example
 * checkDiagnostics([{ phase: "lint", tool: "oxlint", rule: "eslint(no-debugger)", path: "a.ts", line: 3,
 *   column: null, message: "debugger", severity: "error", fixable: false, adr: null }])[0]?.code;
 * // "oxlint/eslint(no-debugger)"
 */
export function checkDiagnostics(findings: readonly Record<string, unknown>[]): Diagnostic[] {
  return findings.map((finding) => {
    const tool = text(finding["tool"]);
    const rule = text(finding["rule"]);
    const code = tool !== undefined && rule !== undefined ? `${tool}/${rule}` : rule;
    const file = text(finding["path"]);
    const line = place(finding["line"]);
    const column = place(finding["column"]);
    return {
      phase: text(finding["phase"]) ?? "check",
      ...(code === undefined ? {} : { code }),
      severity: finding["severity"] === "warning" ? "warning" : "error",
      ...(file === undefined || file === "." ? {} : { file }),
      ...(line === undefined ? {} : { line }),
      ...(column === undefined ? {} : { column }),
      message: text(finding["message"]) ?? code ?? "check finding",
      ...(finding["fixable"] === true ? { fix: "stackra check --fix" } : {}),
    };
  });
}
