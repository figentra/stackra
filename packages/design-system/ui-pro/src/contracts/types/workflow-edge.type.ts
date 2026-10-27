/**
 * Stackra file contract:
 * Purpose: `WorkflowEdge`, one arrow of a `WorkflowCanvas`: from a node to the node that runs after it, with the
 *          branch's condition as words when the target runs only `when` it holds.
 * Boundary: types only; the condition is already words (the caller renders the @stackra/rules condition), never an
 *           expression evaluated here.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0310 (decision 3); OS-230 (step list with branches).
 */

/** One edge of a workflow graph. */
export interface WorkflowEdge {
  /** The id of the node it leaves. */
  readonly from: string;
  /** The id of the node it enters. */
  readonly to: string;
  /** The branch's condition in words (`if paid`); drawn on the arrow and read out with the target. */
  readonly label?: string | undefined;
}
