/**
 * Stackra file contract:
 * Purpose: `runTurboTaskPhase(phase, task, run)`, the body of a `stackra check` phase that is one turbo task across
 *          the workspace (`test`, `test:coverage`): `turbo run <task> --continue` (only the affected members and their
 *          dependents with `--affected`), one finding per failed task.
 * Boundary: starts turbo once; skipped when it is not installed. Heavy runs belong on the testbed, not a laptop.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0182 (test tiers and coverage).
 */
import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";
import type { CheckRun } from "#node/types/check-run.type";
import type { PhaseOutcome } from "#node/types/phase-outcome.type";

/** turbo's summary line naming the failed tasks: `Failed:    @stackra/a#test, @stackra/b#test`. */
const FAILED = /^\s*Failed:\s+(.+)$/m;

/**
 * Run one turbo task as a check phase.
 *
 * @param phase - the phase the findings belong to.
 * @param task - the turbo task, such as `test` or `test:coverage`.
 * @param run - the check run: its root, and the affected files and base when `--affected` is on.
 * @returns no findings when turbo passes, one finding per failed task otherwise, or skipped without turbo.
 * @example
 * await runTurboTaskPhase(COVERAGE_PHASE, "test:coverage", run);
 */
export async function runTurboTaskPhase(
  phase: CheckPhase,
  task: string,
  { root, files, base }: Pick<CheckRun, "root" | "files" | "base">,
): Promise<PhaseOutcome> {
  const filter = files === undefined ? [] : [`--filter=...[${base ?? "origin/main"}]`];
  const output = await runCaptured("turbo", ["run", task, "--continue", ...filter], root);
  if (output === undefined) return { findings: [], skipped: "not installed" };
  if (output.code === 0) return { findings: [] };
  const tasks = (FAILED.exec(`${output.stdout}\n${output.stderr}`)?.[1] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  if (tasks.length === 0) return { findings: [exitFinding(phase, output)] };
  return {
    findings: tasks.map((name) =>
      toolFinding(phase, {
        rule: "failed",
        message: `${name} failed; run \`turbo run ${name}\` for the output`,
      }),
    ),
  };
}
