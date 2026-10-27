/**
 * Stackra file contract:
 * Purpose: `WorkflowNode`, one box of a `WorkflowCanvas`: an automation's trigger or one of its steps, with its title,
 *          an optional detail (the block it calls, its wait) and, on a run, where it stands.
 * Boundary: types only. Mapping an automation document (@stackra/workflow) onto nodes and edges is the caller's; this
 *           package never imports the engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0310 (decision 3); OS-230 (graph canvas).
 */
import type { ReactNode } from "react";

import type { PlanStepStatus } from "#contracts/enums/plan-step-status.enum";

/** One node of a workflow graph. */
export interface WorkflowNode {
  /** The node's id, unique in the graph (the step's name, or `trigger`). */
  readonly id: string;
  /** What the node is (`Send the confirmation`), also read out as its name. */
  readonly title: string;
  /** More about it: the block it calls, its wait or its result. */
  readonly detail?: ReactNode | undefined;
  /** Where it stands on a run; left out when the canvas shows the document, not a run. */
  readonly status?: PlanStepStatus | undefined;
}
