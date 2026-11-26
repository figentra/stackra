/**
 * Stackra file contract:
 * Purpose: `connectDetachedRuns()`, which registers the database's wrapper in @stackra/actions' `DETACHED_RUNS`, so
 *          every detached call's run (`ctx.detach()`) runs through the connected database's `runDetached`: outside the
 *          call's finished transaction, with `Database.detached()` answering the call's step.
 * Boundary: a driver calls it when it becomes `Database.current()`; registering again adds nothing (one wrapper
 *           function). The wrapper reads the connected database when a run starts, and runs the work as it is when
 *           none is connected. It imports only the registry of `@stackra/actions/contracts`, as this package already
 *           imports `ContextStorage` from there, so no new dependency edge.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0238 (one database per service).
 */
import { DETACHED_RUNS } from "@stackra/actions/contracts";
import type { DetachedRun } from "@stackra/actions/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";

/** Runs a detached call's work through the connected database. */
const RUN_IN_DATABASE: DetachedRun = (step, work) => {
  const database = ACTIVE_DATABASE.current;
  return database === undefined ? work() : database.runDetached(step, work);
};

/**
 * Registers the database's detached-run wrapper.
 *
 * @example
 * ACTIVE_DATABASE.current = driver;
 * connectDetachedRuns();
 */
export function connectDetachedRuns(): void {
  DETACHED_RUNS.add(RUN_IN_DATABASE);
}
