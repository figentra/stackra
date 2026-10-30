/**
 * Stackra file contract:
 * Purpose: `testMaxWorkers`, the worker cap of the unit preset: half the CPUs (at least one), or `STACKRA_TEST_MAX_WORKERS` when it is a positive integer.
 * Boundary: reads the environment it is given; parallel PGlite boots starve each other, hence the cap.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { availableParallelism } from "node:os";

/** The number of test workers. */
export function testMaxWorkers(env: NodeJS.ProcessEnv = process.env): number {
  const set = Number.parseInt(env["STACKRA_TEST_MAX_WORKERS"] ?? "", 10);
  return set > 0 ? set : Math.max(1, Math.floor(availableParallelism() / 2));
}
