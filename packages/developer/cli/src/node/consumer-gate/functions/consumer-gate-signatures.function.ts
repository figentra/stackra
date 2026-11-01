/**
 * Stackra file contract:
 * Purpose: `consumerGateSignatures(log)`, the log lines that name a failure (`error TS`, `FAIL`, `ERR_PNPM_*`,
 *          `Error:`): the unit an allow entry's `match` is compared with.
 * Boundary: pure; turbo's `pkg:task: ` line prefix is stripped first (so `FAIL` anchors match under turbo); lines are trimmed, cut at 300 characters and de-duplicated.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The `@scope/pkg:task: ` (or `pkg:task: `) prefix turbo puts on every line of a task's output. */
const TURBO_PREFIX = /^(?:@[\w.-]+\/)?[\w.-]+:[\w:.-]+: /;

/**
 * The failure lines of a step log.
 *
 * @param log - the step's captured output.
 * @example
 * consumerGateSignatures("ok\na.ts(1,1): error TS6133 'A'\n"); // ["a.ts(1,1): error TS6133 'A'"]
 */
export function consumerGateSignatures(log: string): string[] {
  const found = log
    .split("\n")
    .map((line) => line.replace(TURBO_PREFIX, ""))
    .filter((line) => /error TS\d+|^\s*(FAIL|×)\s|\bERR_PNPM_\w+|\bError:/.test(line))
    .map((line) => line.trim().slice(0, 300));
  return [...new Set(found)];
}
