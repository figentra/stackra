/**
 * Stackra file contract:
 * Purpose: the props of the `WorkflowCanvas`: an automation as a graph of its trigger and steps, the arrows between
 *          them with their branch conditions, its accessible name, the selected node and what selecting one does.
 * Boundary: types only. The canvas shows and selects; editing a step stays the caller's (the builder's step form).
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); OS-230 (graph canvas); WCAG 2.2 SC 2.1.1.
 */
import type { ReactNode } from "react";

import type { WorkflowEdge } from "#contracts/types/workflow-edge.type";
import type { WorkflowNode } from "#contracts/types/workflow-node.type";

/** Props of the `WorkflowCanvas`. */
export interface WorkflowCanvasContractProps {
  /** The graph's name for screen readers (`Cash on delivery confirmation`). */
  readonly label: string;
  /** The nodes; their order is the order within a column. */
  readonly nodes: readonly WorkflowNode[];
  /** The arrows; an edge naming an unknown node is ignored. */
  readonly edges: readonly WorkflowEdge[];
  /** The id of the selected node. */
  readonly selectedId?: string | undefined;
  /** Called with a node's id when it is pressed; without it the nodes are not selectable. */
  readonly onSelect?: ((id: string) => void) | undefined;
  /** What the viewer can do with the automation, under the canvas. */
  readonly actions?: ReactNode | undefined;
}
