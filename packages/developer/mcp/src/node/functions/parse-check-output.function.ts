/**
 * Stackra file contract:
 * Purpose: `parseCheckOutput(output)`, the findings of `stackra check --format=json` (and its aliases): the JSON array
 *          the run prints last, after any phase notices it wrote to standard error, which share the captured output.
 * Boundary: pure; undefined when no JSON array ends the output (the run failed before its report), so a caller never
 *           mistakes a crash for a clean run.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check); STA-2873.
 */

/**
 * The findings array that ends `output`, or undefined.
 *
 * @param output - the output of a `--format=json` check run.
 * @example
 * parseCheckOutput("lint: 2 files\n[]\n"); // []
 */
export function parseCheckOutput(output: string): Record<string, unknown>[] | undefined {
  const lines = output.split(/\r?\n/);
  // The report starts at a line of its own that opens the array; try the last such line first.
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (!(lines[index] ?? "").startsWith("[")) continue;
    try {
      const parsed: unknown = JSON.parse(lines.slice(index).join("\n"));
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    } catch {
      // Not the start of the report; an earlier line may be.
    }
  }
  return undefined;
}
