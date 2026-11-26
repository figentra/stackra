/**
 * Stackra file contract:
 * Purpose: `FaultTiming`, when an injected fault strikes a call: `before` the target is reached (the request never
 *          arrived: nothing happened) or `after` the target acted (the answer was lost: it happened, and the caller
 *          cannot tell).
 * Boundary: a public type of the `.` entry; `injectFaults` reads it from a `FaultRule`.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection); ADR 0269 (decision 2: generic kit).
 */

/** When a fault strikes: before the target acts, or after it acted with the answer lost. */
export type FaultTiming = "before" | "after";
