/**
 * Stackra file contract:
 * Purpose: `findErrorCode(typed)`, the error-code reference row `stackra explain` shows for what was typed: the code
 *          as printed, then in another case or with `-` for `_`, then a `stackra check` finding copied as the check
 *          prints it, `<tool>/<rule>` (`repo-checks/imports` finds `imports`, `gen/stale` finds `stale`). Only a check
 *          rule is found through a tool prefix, so `oxlint/shape_number_kind` does not reach gen's code.
 * Boundary: pure; reads the reference through `errorCodeEntry` (`@stackra/gen`) only.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 26); STA-2891.
 */
import { errorCodeEntry, type ErrorCodeEntry } from "@stackra/gen";

/**
 * The reference row for `typed`.
 *
 * @param typed - a code as a tool printed it, or a check finding's `<tool>/<rule>`.
 * @returns the row, or `undefined` when the reference lists no such code or check rule.
 * @example
 * findErrorCode("repo-checks/imports")?.code; // "imports"
 */
export function findErrorCode(typed: string): ErrorCodeEntry | undefined {
  const code = typed.trim();
  const entry = errorCodeEntry(code) ?? errorCodeEntry(code.replaceAll("-", "_"));
  if (entry !== undefined) return entry;
  const slash = code.lastIndexOf("/");
  if (slash === -1) return undefined;
  // `stackra check` prints `<tool>/<rule>`; the rule after the last `/` is the check code.
  const rule = errorCodeEntry(code.slice(slash + 1));
  return rule?.tool === "check" ? rule : undefined;
}
