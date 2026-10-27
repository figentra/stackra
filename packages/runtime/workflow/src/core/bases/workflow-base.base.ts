/**
 * Stackra file contract:
 * Purpose: `WorkflowBase<I>`, the instance side every workflow shares: the type-only `~kind` and `~input` brands that
 *          `Run<W>` reads and that keep a class of another kind from standing in for a workflow.
 * Boundary: no state and no behaviour; `Workflow({ ... })` (workflow.base.ts) is the kind base authors extend, and
 *           its prototype is this class's, so `instanceof WorkflowBase` holds for every workflow. The entry exports it
 *           as a type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25: kinds are bases); ADR 0305 (rules 10 to 13: one declaration
 *                     per file).
 */

/** The instance side every workflow shares. */
export abstract class WorkflowBase<I = unknown> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a workflow. */
  declare readonly "~kind": "workflow";

  /** Type-only: the run's input, which `Run<W>` reads. */
  declare readonly "~input": I;
}
