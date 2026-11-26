/**
 * Stackra file contract:
 * Purpose: `consumerGateSignatures(log)`, the log lines that name a failure (`error TS`, `FAIL`, `ERR_PNPM_*`,
 *          `Error:`, and the Stackra toolchain's own: a gen or validate finding `error <snake_code>`, an oxlint
 *          `x rule(name):` line, a cspell `Unknown word`, oxfmt's `Format issues found` and each file row it lists, a
 *          `stackra validate` finding row and a failed phase row): the unit an allow entry's `match` is compared with.
 * Boundary: pure; turbo's `pkg:task: ` line prefix is stripped first (so `FAIL` anchors match under turbo); lines are trimmed, cut at 300 characters and de-duplicated.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813; STA-2705.
 */

/** A failure line: tsc, vitest, pnpm and Node errors, then gen, oxlint, cspell, oxfmt and `stackra validate`. */
const FAILURE = new RegExp(
  [
    String.raw`error TS\d+`,
    String.raw`^\s*(FAIL|×)\s`,
    String.raw`\bERR_PNPM_\w+`,
    String.raw`\bError:`,
    String.raw`\serror [a-z][a-z0-9]*(?:_[a-z0-9]+)+\b`,
    String.raw`^\s*x [\w-]+(?:\([\w/-]+\))?: `,
    String.raw`Unknown word \(`,
    String.raw`Format issues found`,
    String.raw`^\S+ \(\d+(?:\.\d+)?m?s\)$`,
    String.raw`^\S+\s{2,}[a-z][\w-]*\/[a-z][\w-]*\s{2,}\S`,
    String.raw`^[a-z][\w-]*\s+failed\s+\d+\s`,
  ].join("|"),
);

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
    .filter((line) => FAILURE.test(line))
    .map((line) => line.trim().slice(0, 300));
  return [...new Set(found)];
}
