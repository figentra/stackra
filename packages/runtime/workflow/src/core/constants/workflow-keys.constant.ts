/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_KEYS`, the registered workflow and signal classes with their keys, both ways: the engine stores a
 *          run's workflow and a held signal's class by key, and finds the class again by key on resume.
 * Boundary: module state of the process, written only by `registerWorkflows` (gen's entry, or the first use of a
 *           class), read by `workflowKey` and the engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22: identities are derived and locked); the queue precedent
 *                     (`JOB_TYPES`).
 */
import type { AnyClass } from "@stackra/container";

/** The registered workflow and signal classes. */
export const WORKFLOW_KEYS = Object.freeze({
  /** Key to class. */
  byKey: new Map<string, AnyClass>(),

  /** Class to key. */
  keys: new Map<AnyClass, string>(),
});
