/**
 * Stackra file contract:
 * Purpose: `formatFinding(finding, format)`, one finding as `stackra check` prints it: `path:line:col  tool/rule  message
 *          [fixable]` for text, or a GitHub Actions `::error` / `::warning` annotation.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); GitHub Actions workflow commands (annotation escaping).
 */
import type { Finding } from "@stackra/repo-checks/node";

/** Escapes a workflow-command message: `%`, CR and LF. */
const escapeData = (text: string): string =>
  text.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

/** Escapes a workflow-command property: the message escapes plus `:` and `,`. */
const escapeProperty = (text: string): string =>
  escapeData(text).replaceAll(":", "%3A").replaceAll(",", "%2C");

/**
 * The printed line of `finding`.
 *
 * @param finding - the finding to print.
 * @param format - `text` for the terminal, `github` for an Actions annotation.
 * @example
 * formatFinding(finding, "text"); // "a.ts:3:5  oxlint/eslint(no-debugger)  `debugger` statement is not allowed"
 */
export function formatFinding(finding: Finding, format: "text" | "github"): string {
  const { path, line, column, tool, rule, message } = finding;
  if (format === "github") {
    const properties = [
      `file=${escapeProperty(path)}`,
      ...(line === null ? [] : [`line=${line}`]),
      ...(column === null ? [] : [`col=${column}`]),
      `title=${escapeProperty(`${tool}/${rule}`)}`,
    ];
    return `::${finding.severity} ${properties.join(",")}::${escapeData(message)}`;
  }
  const at =
    line === null ? path : column === null ? `${path}:${line}` : `${path}:${line}:${column}`;
  const marks = [
    ...(finding.fixable ? ["[fixable]"] : []),
    ...(finding.severity === "warning" ? ["[warning]"] : []),
  ];
  return [at, `${tool}/${rule}`, message, ...marks].join("  ");
}
