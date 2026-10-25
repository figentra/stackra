/**
 * Stackra file contract:
 * Purpose: `Workflow({ startOn, correlate, timeout })` and `Workflow<Input>({ timeout })`, the kind base of a durable
 *          run: its public async methods are its steps, run in declaration order (`@Step` gives one options, `after`
 *          reorders), `undo<Step>` compensates a step, and `output(run)` builds the result.
 * Boundary: called only, generic in its input (an action names it, `startOn` gives it). The options are checked when
 *           the class is defined and recorded in the kind registry; the engine reads the steps when it first runs the
 *           class. A binding: dependencies are constructor parameters. It runs only through the engine (`ctx.run` from
 *           an action, or `startOn`), never by calling a step from another class; no step body waits or sleeps, so the
 *           same class runs on any engine driver. `WorkflowBase` is the instance base; the entry exports it as a type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 3, 16, 18 and 25); ADR 0151 (0294 note: the class is the graph); ADR 0101
 *                     (0294 note: only an action or `startOn` starts a run); ADR 0102 (decision 5).
 */
import { createKind } from "@stackra/container";
import { duration } from "@stackra/validation";

import type { WorkflowClass } from "#core/types/workflow-class.type";
import type { WorkflowOptions } from "#core/types/workflow-options.type";

/** The instance side every workflow shares. */
export abstract class WorkflowBase<I = unknown> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a workflow. */
  declare readonly "~kind": "workflow";

  /** Type-only: the run's input, which `Run<W>` reads. */
  declare readonly "~input": I;
}

/** A workflow instance. */
export type Workflow<I = unknown> = WorkflowBase<I>;

/** Checks the options of the called form. */
function read(options: WorkflowOptions<unknown> = {}) {
  const { startOn, correlate, timeout } = options;
  if (startOn !== undefined && typeof startOn !== "function")
    throw new TypeError(
      `Workflow({ startOn }) takes an event class, got ${JSON.stringify(startOn)}`,
    );
  if (correlate !== undefined && (typeof correlate !== "function" || startOn === undefined))
    throw new TypeError(
      "Workflow({ correlate }) is a function of the startOn event, so it needs startOn",
    );
  if (timeout !== undefined)
    try {
      duration(timeout);
    } catch {
      throw new RangeError(
        `Workflow({ timeout }) must be a duration such as "20m", got ${JSON.stringify(timeout)}`,
      );
    }
  return { ...options };
}

/**
 * The workflow kind base.
 *
 * @example
 * export class CreateOrderWorkflow extends Workflow<CreateOrderInput>({ timeout: "2m" }) {
 *   async price(run: Run<this>, ctx: StepContext): Promise<PricedOrder> { ... }
 *   async reserveStock(run: Run<this>): Promise<void> { ... }
 *   async undoReserveStock(run: Run<this>): Promise<void> { ... }
 *   output(run: Run<this>): CreateOrderOutput { ... }
 * }
 */
export const Workflow = createKind("workflow", WorkflowBase, read) as <I = void>(
  options: WorkflowOptions<I>,
) => WorkflowClass<I>;
