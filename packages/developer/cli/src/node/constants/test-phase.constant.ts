/**
 * Stackra file contract:
 * Purpose: `TEST_PHASE`, phase 12 of `stackra check`, opt-in (`--with-tests`, or named in `--only`): `turbo run test`
 *          (only the affected members and their dependents with `--affected`), one finding per failed task.
 * Boundary: starts turbo; skipped when it is not installed. Heavy runs belong on ci-box, not a laptop. The coverage floors
 *           (`test:coverage`) are not run here yet.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage).
 */
import { exitFinding } from "#node/functions/exit-finding.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { toolFinding } from "#node/functions/tool-finding.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** turbo's summary line naming the failed tasks: `Failed:    @stackra/a#test, @stackra/b#test`. */
const FAILED = /^\s*Failed:\s+(.+)$/m;

/** The `test` phase. */
export const TEST_PHASE: CheckPhase = {
  name: "test",
  tool: "vitest",
  adr: "0182",
  async run({ root, files, base }) {
    const filter = files === undefined ? [] : [`--filter=...[${base ?? "origin/main"}]`];
    const output = await runCaptured("turbo", ["run", "test", "--continue", ...filter], root);
    if (output === undefined) return { findings: [], skipped: "not installed" };
    if (output.code === 0) return { findings: [] };
    const tasks = (FAILED.exec(`${output.stdout}\n${output.stderr}`)?.[1] ?? "")
      .split(",")
      .map((task) => task.trim())
      .filter(Boolean);
    if (tasks.length === 0) return { findings: [exitFinding(TEST_PHASE, output)] };
    return {
      findings: tasks.map((task) =>
        toolFinding(TEST_PHASE, {
          rule: "failed",
          message: `${task} failed; run \`turbo run ${task}\` for the output`,
        }),
      ),
    };
  },
};
