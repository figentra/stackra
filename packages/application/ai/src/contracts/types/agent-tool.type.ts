/**
 * Stackra file contract:
 * Purpose: `AgentTool`, one tool as an agent run offers it to the model: the model-facing name, the action key it
 *          dispatches, its description and input JSON Schema, and the mode it runs in (applied, or proposed as a
 *          draft when the permission matrix says suggest).
 * Boundary: a type only; the `ToolDispatcher` lists them for the acting principal, its roles and record, so a tool the
 *           matrix sets to off is never offered. Built from the manifest's tool rows, never hand-written.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 3); ADR 0155 (decision 1); R3-SO-02 (suggest = propose).
 */
import type { Json } from "@stackra/contracts";

/** A tool offered to the model. */
export interface AgentTool {
  /** The tool name the model calls (`orders_order_cancel`). */
  readonly name: string;

  /** The action or query key it dispatches (`orders.order.cancel@1`). */
  readonly action: string;

  /** The description written on the action. */
  readonly description?: string;

  /** The input's JSON Schema. */
  readonly inputSchema: { readonly [key: string]: Json };

  /** `apply` runs the action; `propose` returns a draft with no effects. */
  readonly mode: "apply" | "propose";
}
