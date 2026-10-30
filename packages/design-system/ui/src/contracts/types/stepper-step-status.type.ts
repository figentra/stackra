/**
 * Stackra file contract:
 * Purpose: `StepperStepStatus`, where a Stepper step stands: done, the one in hand, still ahead, failing, or ahead and
 *          skippable.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (owner request 2026-10-29).
 */

/** A step's status. */
export type StepperStepStatus = "complete" | "current" | "upcoming" | "error" | "optional";
