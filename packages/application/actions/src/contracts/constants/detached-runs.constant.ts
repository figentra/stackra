/**
 * Stackra file contract:
 * Purpose: `DETACHED_RUNS`, the wrappers every detached call's run enters, outermost first in insertion order: how a
 *          lower package (the database) learns the call's step and leaves the call's finished transaction behind,
 *          without this package importing it.
 * Boundary: a process-wide set; a package adds its one wrapper (the same function each time, so a second add is a
 *           no-op) when it connects, and never removes another's. A wrapper calls `work` exactly once.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0294 (decision 15).
 */
import type { DetachedRun } from "#contracts/types/detached-run.type";

/** The registered wrappers. */
export const DETACHED_RUNS: Set<DetachedRun> = new Set();
