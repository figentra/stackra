/**
 * Stackra file contract:
 * Purpose: `toFinding(phase, raw)`, a repository check's text finding located as a `Finding`: the path (joined to the
 *          member directory when the text names a member-relative one), the line and column when the text carries
 *          them, the message, and the ADR the message names.
 * Boundary: pure. A text that names no path is about its member directory (or `.`); repository checks have no autofix
 *           yet, so `fixable` is false.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */
import type { Finding } from "#node/types/finding.type";
import type { RawFinding } from "#node/types/raw-finding.type";

/** `path:` or `path:line:` or `path:line:col:` at the start of a finding, with no space in the path. */
const LOCATED = /^(\S+?)(?::(\d+))?(?::(\d+))?: ([\s\S]*)$/;

/**
 * The located finding of `raw`.
 *
 * @param phase - the `stackra check` phase that ran the check.
 * @param raw - the check's rule, member directory and text.
 * @example
 * toFinding("docs", { rule: "doc-standard", dir: "", text: "a.ts:3: export x has no TSDoc block (ADR 0007)" });
 * // { phase: "docs", tool: "repo-checks", rule: "doc-standard", path: "a.ts", line: 3, column: null, …, adr: "0007" }
 */
export function toFinding(phase: string, raw: RawFinding): Finding {
  const [, named, row, column, rest]: (string | undefined)[] = LOCATED.exec(raw.text) ?? [];
  const path =
    named === undefined
      ? raw.dir || "."
      : raw.dir === "" || named.startsWith(`${raw.dir}/`)
        ? named
        : `${raw.dir}/${named}`;
  const message = rest ?? raw.text;
  return {
    phase,
    tool: "repo-checks",
    rule: raw.rule,
    path,
    line: row === undefined ? null : Number(row),
    column: column === undefined ? null : Number(column),
    message,
    severity: "error",
    fixable: false,
    adr: /\bADR (\d{4})\b/.exec(message)?.[1] ?? null,
  };
}
