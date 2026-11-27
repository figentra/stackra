/**
 * Stackra file contract:
 * Purpose: `parseTestOutput(output)`, the `TestSummary` of a Vitest run's plain output: the `Test Files` and `Tests`
 *          counts (added up when Turborepo ran several members, each line carrying its task prefix) and each
 *          `FAIL <file> > <suite> > <test>` with the first line of its error, or `FAIL <file> [ <file> ]` for a file
 *          that failed to load. Undefined when the output holds no Vitest summary (the run stopped before the tests).
 * Boundary: pure; reads text without colour codes. Nothing is guessed: a count the summary does not print is 0.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-2873.
 */
import type { TestSummary } from "#node/types/test-summary.type";

/** `Test Files  1 failed | 2 passed (3)`, after an optional task prefix. */
const FILES = /\bTest Files\s+(.+?)\s+\(\d+\)\s*$/;

/** `      Tests  1 failed | 1 passed | 1 skipped (3)`, after an optional task prefix. */
const TESTS = /\bTests\s{2,}(.+?)\s+\(\d+\)\s*$/;

/** `FAIL  src/a.test.ts > suite > test`, or `FAIL  src/b.test.ts [ src/b.test.ts ]`. */
const FAIL = /\bFAIL\s+(\S+?\.(?:test|spec)\.[cm]?[jt]sx?)(?:\s+\[[^\]]*\])?(?:\s+>\s+(.+?))?\s*$/;

/** The `<n> <outcome>` counts of one summary line. */
function counts(text: string): Map<string, number> {
  const found = new Map<string, number>();
  for (const [, count, outcome] of text.matchAll(/(\d+)\s+(passed|failed|skipped|todo)/g))
    found.set(outcome ?? "", Number(count));
  return found;
}

/**
 * The summary of a Vitest run, or undefined when the output has none.
 *
 * @param output - the run's output without colour codes.
 * @example
 * parseTestOutput(" Test Files  1 passed (1)\n      Tests  2 passed (2)\n")?.tests.passed; // 2
 */
export function parseTestOutput(output: string): TestSummary | undefined {
  const files = { passed: 0, failed: 0, skipped: 0 };
  const tests = { passed: 0, failed: 0, skipped: 0, todo: 0 };
  const failures: { file: string; test?: string; message?: string }[] = [];
  const seen = new Set<string>();
  let summarized = false;
  const lines = output.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const filesLine = FILES.exec(line);
    if (filesLine !== null) {
      summarized = true;
      const found = counts(filesLine[1] ?? "");
      files.passed += found.get("passed") ?? 0;
      files.failed += found.get("failed") ?? 0;
      files.skipped += found.get("skipped") ?? 0;
      continue;
    }
    const testsLine = TESTS.exec(line);
    if (testsLine !== null) {
      const found = counts(testsLine[1] ?? "");
      tests.passed += found.get("passed") ?? 0;
      tests.failed += found.get("failed") ?? 0;
      tests.skipped += found.get("skipped") ?? 0;
      tests.todo += found.get("todo") ?? 0;
      continue;
    }
    const fail = FAIL.exec(line);
    if (fail === null) continue;
    const [, file = "", test] = fail;
    const key = `${file}\u0000${test ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // The error's first line follows the FAIL line, after any blank line.
    const message = lines
      .slice(index + 1, index + 4)
      .map((next) => next.trim())
      .find((next) => next !== "");
    failures.push({
      file,
      ...(test === undefined ? {} : { test }),
      ...(message === undefined || FAIL.test(message) ? {} : { message }),
    });
  }
  return summarized ? { files, tests, failures } : undefined;
}
