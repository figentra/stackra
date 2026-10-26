/**
 * Stackra file contract:
 * Purpose: `runOfCall`, the document run a call id names: a document step calls its action block with the step key
 *          (`<run id>:<step>`, `<run id>:<step>:<item>` in a for-each step) as the call id, so every event the block
 *          records carries it as its correlation, and the trigger that event fires finds the run that caused it.
 * Boundary: internal and pure: it only parses; a call id of anything else (a request, an outside event) is no run.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (correlation: one id per unit of work); OS-232 (chain depth).
 */
import type { PublicId } from "@stackra/contracts";

/** A run id at the start of a step key. */
const STEP_KEY = /^(wfr_[0-9a-z]{26}):/;

/**
 * The run whose step made call `callId`, or `undefined`.
 *
 * @example
 * runOfCall("wfr_01jb6z3q0m4v9tbn1xg5rd2hc8:notify"); // "wfr_01jb6z3q0m4v9tbn1xg5rd2hc8"
 * runOfCall("evt_1"); // undefined
 */
export function runOfCall(callId: string | undefined): PublicId<"wfr"> | undefined {
  const match = callId === undefined ? null : STEP_KEY.exec(callId);
  return match === null ? undefined : (match[1] as PublicId<"wfr">);
}
