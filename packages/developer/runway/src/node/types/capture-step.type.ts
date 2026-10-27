/**
 * Stackra file contract:
 * Purpose: `CaptureStep`, one command of the screenshot capture job, with how long the simulator settles after it.
 * Boundary: type only; a `DeployStep` plus `settleMs`. No secret is ever an argument.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3: plan, then run the same list); ADR 0441 (as amended: D19).
 */
import type { DeployStep } from "#core/types/deploy-step.type";

/** One capture command. */
export interface CaptureStep extends DeployStep {
  /** Milliseconds to wait after the command before the next one. */
  readonly settleMs?: number;
}
