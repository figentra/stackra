/**
 * Stackra file contract:
 * Purpose: `DetachedRun`, a wrapper a lower package registers in `DETACHED_RUNS`, which every `DetachedCall.run` (and a step opened outside one)
 *          enters around its work, so that package can keep the call's step for its own code (the database's
 *          `Database.detached()`) and leave state the call's own transaction left behind.
 * Boundary: a type only; they name no class of `core`, so `./contracts` stays a leaf.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0294 (decision 15).
 */
import type { DetachedStep } from "#contracts/types/detached-step.type";

/** Runs `work` inside the detached call whose step is `step`. */
export type DetachedRun = <T>(step: DetachedStep, work: () => Promise<T>) => Promise<T>;
