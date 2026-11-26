/**
 * Stackra file contract:
 * Purpose: `COVERAGE_PHASE`, phase 14 of `stackra check`, opt-in with `test` (`--with-tests`, so `stackra verify`, or
 *          named in `--only`): `turbo run test:coverage` (only the affected members and their dependents with
 *          `--affected`), the unit tier under each member's coverage floor (80/80/70, or 90/90/80 for the packages ADR
 *          0182 names), one finding per member below its floor or failing.
 * Boundary: starts turbo; skipped when it is not installed. Heavy runs belong on the testbed, not a laptop.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: coverage floors).
 */
import { runTurboTaskPhase } from "#node/functions/run-turbo-task-phase.function";
import type { CheckPhase } from "#node/types/check-phase.type";

/** The `coverage` phase. */
export const COVERAGE_PHASE: CheckPhase = {
  name: "coverage",
  tool: "vitest",
  adr: "0182",
  run: (run) => runTurboTaskPhase(COVERAGE_PHASE, "test:coverage", run),
};
