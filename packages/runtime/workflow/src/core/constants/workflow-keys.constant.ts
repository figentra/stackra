/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_KEYS`, the registered workflow, signal and awaited event classes with their keys, both ways, and
 *          each workflow class by key and version: the engine stores a run's workflow and a held signal's class by
 *          key, and finds the class of the run's pinned version again on resume.
 * Boundary: module state of the process, written only by `registerWorkflows` (gen's entry, or the first use of a
 *           class), read by `workflowKey` and the engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22: identities are derived and locked); ADR 0152 (decision 2: the
 *                     version pin); the queue precedent (`JOB_TYPES`).
 */
import type { AnyClass } from "@stackra/container";

/** The registered workflow and signal classes. */
export const WORKFLOW_KEYS = Object.freeze({
  /** Key to class: a workflow key names its highest registered version. */
  byKey: new Map<string, AnyClass>(),

  /** `<key>@<version>` to the workflow class of that version. */
  versions: new Map<string, AnyClass>(),

  /** Class to key. */
  keys: new Map<AnyClass, string>(),
});
