/**
 * Stackra file contract:
 * Purpose: `documentPlan`, an automation document (or a plan) compiled to the engine's one graph format: a step per
 *          document step, in order, with its retries, its wait on a trigger block correlated by reference, its timeout,
 *          and its condition evaluated over the trigger's facts at the run's start.
 * Boundary: internal and pure over `BUILDING_BLOCKS`; the document is already checked. The run's key is
 *           `DOCUMENT_WORKFLOW` and its version the document's. The engine builds the step bodies (an action call
 *           through the pipeline); this only plans them.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (decisions 1, 2 and 5); ADR 0122 (decision 3); ADR 0331 (decisions 1 and 6).
 */
import { Duration } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";
import { type Condition, evaluate } from "@stackra/rules";
import { duration } from "@stackra/validation";

import { BUILDING_BLOCKS } from "#core/constants/building-blocks.constant";
import { DOCUMENT_WORKFLOW } from "#core/constants/document-workflow.constant";
import { correlationKey } from "#core/functions/correlation-key.function";
import { factsOf } from "#core/functions/facts-of.function";
import { lookupRef } from "#core/functions/lookup-ref.function";
import { triggerRules } from "#core/functions/trigger-rules.function";
import { workflowKey } from "#core/functions/workflow-key.function";
import type { AutomationDocument } from "#core/types/automation-document.type";
import type { BuildingBlock } from "#core/types/building-block.type";
import type { DocumentView } from "#core/types/document-view.type";
import type { StepPlan } from "#core/types/step-plan.type";
import type { WorkflowPlan } from "#core/types/workflow-plan.type";

/** The milliseconds of a checked duration text. */
const millisecondsOf = (text: string): number => Duration.toMilliseconds(duration(text));

/**
 * The registered block `key`.
 *
 * @throws TypeError when this process registers no such block (another service runs the document).
 */
function blockOf(key: string): BuildingBlock {
  const block = BUILDING_BLOCKS.get(key);
  if (block === undefined)
    throw new TypeError(`documentPlan: no building block ${key} is registered`);
  return block;
}

/**
 * The plan of `document`.
 *
 * @throws TypeError when a block it names is not registered in this process.
 * @example
 * documentPlan(checkAutomation(input)).steps.map((step) => step.name); // ["confirm", "ship"]
 */
export function documentPlan(document: AutomationDocument): WorkflowPlan {
  const trigger = document.trigger === undefined ? undefined : blockOf(document.trigger.block);
  const steps = document.steps.map((step): StepPlan => {
    if (step.block !== undefined) blockOf(step.block);
    const { when, waitFor } = step;
    const awaited = waitFor === undefined ? undefined : blockOf(waitFor.block);
    const timeout = waitFor?.timeout ?? step.timeout;
    return Object.freeze({
      name: step.name,
      after: Object.freeze([]),
      attempts: step.retry?.attempts ?? 1,
      backoff: step.retry?.backoff ?? Backoff.Exponential,
      ...(when === undefined || trigger === undefined
        ? {}
        : {
            when: (view: DocumentView) =>
              // reason: `checkAutomation` checked `when` against the trigger's facts
              evaluate(
                triggerRules(trigger),
                when as Condition,
                factsOf(trigger, view.input.input),
                {
                  now: view.startedAt,
                },
              ).matched,
          }),
      ...(awaited === undefined || waitFor === undefined
        ? {}
        : {
            waitFor: awaited.type,
            signal: workflowKey(awaited.type),
            correlate: (view: DocumentView) =>
              correlationKey(
                lookupRef(waitFor.correlate, { input: view.input.input, results: view.results }),
              ),
          }),
      ...(timeout === undefined ? {} : { timeout: millisecondsOf(timeout) }),
    });
  });
  return Object.freeze({
    key: DOCUMENT_WORKFLOW,
    version: document.version,
    steps: Object.freeze(steps),
    ...(document.timeout === undefined ? {} : { timeout: millisecondsOf(document.timeout) }),
  });
}
