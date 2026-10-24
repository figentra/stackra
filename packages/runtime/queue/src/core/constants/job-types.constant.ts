/**
 * Stackra file contract:
 * Purpose: `JOB_TYPES`, the actions this process can run as jobs, both ways: by key for the worker that reserved a
 *          stored job, and the key of each class for `QueueService` when it stores one.
 * Boundary: process-wide and internal: written by `registerJobs` (gen's entry, with the locked keys) and by `readJob`
 *           for a class pushed before any registration (with its written key), read by the worker.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22: locked identities); ADR 0305 (rule 28: the job's name is the
 *                     action's key).
 */
import type { Action } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

/** The registered job actions. */
export const JOB_TYPES = Object.freeze({
  /** Key to action class. */
  byKey: new Map<string, AnyClass<Action>>(),

  /** Action class to key. */
  keys: new Map<AnyClass<Action>, string>(),
});
