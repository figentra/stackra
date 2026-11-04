/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_TRIGGER_ALLOWED`, the workflow jobs `checkWorkflowTriggers` skips (a paid job on a push or pull
 *          request trigger, a deploy identity in a job with no environment), each with its reason. Empty: core's
 *          workflows pass.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0166, ADR 0167; STA-256.
 */
export const WORKFLOW_TRIGGER_ALLOWED: readonly {
  readonly path: string;
  readonly job: string;
  readonly reason: string;
}[] = [];
