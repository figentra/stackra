/**
 * Stackra file contract:
 * Purpose: `runEvals(cases, subject)`, an eval suite run: each case's input through the subject, then its check.
 * Boundary: cases run one at a time, in order, so a recorded model replays deterministically. A subject that throws or a
 *           check that throws fails that case only. The pass mark is the caller's (CI compares `score`).
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 4 and enforcement: eval suites run in CI); ADR 0100 (decision 12).
 */
import type { EvalCase } from "#core/types/eval-case.type";
import type { EvalReport } from "#core/types/eval-report.type";

/**
 * The report of `cases` against `subject`.
 *
 * @throws RangeError when two cases share a name.
 * @example
 * const report = await runEvals(cases, (text) => decide({ model, prompt: text, yesNo: true }));
 * expect(report.score).toBeGreaterThanOrEqual(0.9);
 */
export async function runEvals<I, O>(
  cases: readonly EvalCase<I, O>[],
  subject: (input: I) => O | Promise<O>,
): Promise<EvalReport> {
  if (new Set(cases.map((each) => each.name)).size !== cases.length)
    throw new RangeError("runEvals: case names are unique in a suite");
  const passed: string[] = [];
  const failed: string[] = [];
  for (const each of cases) {
    let ok: boolean;
    try {
      ok = each.check(await subject(each.input));
    } catch {
      ok = false;
    }
    (ok ? passed : failed).push(each.name);
  }
  return { passed, failed, score: cases.length === 0 ? 1 : passed.length / cases.length };
}
