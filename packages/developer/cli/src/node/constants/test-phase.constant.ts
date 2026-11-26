/**
 * Stackra file contract:
 * Purpose: `TEST_PHASE`, phase 13 of `stackra check`, opt-in (`--with-tests`, or named in `--only`): `turbo run test`
 *          (only the affected members and their dependents with `--affected`), one finding per failed task.
 * Boundary: starts turbo; skipped when it is not installed. Heavy runs belong on the testbed, not a laptop. The
 *           coverage floors run in the next phase, `coverage` (`COVERAGE_PHASE`).
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers and coverage).
 */
import { runTurboTaskPhase } from "#node/functions/run-turbo-task-phase.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** The `test` phase. */
export const TEST_PHASE: CheckPhase = {
  name: "test",
  tool: "vitest",
  adr: "0182",
  run: (run) => runTurboTaskPhase(TEST_PHASE, "test", run),
};
