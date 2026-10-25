/**
 * Stackra file contract:
 * Purpose: `dryRun`, the dry run of an automation document (or a plan) on a sample input: it checks the document, then
 *          says for each step whether it would run, be skipped or wait, the input it would send and its condition's
 *          explanation.
 * Boundary: pure and deterministic: no action is called, nothing is written, the time is `options.now`. A step whose
 *           input names a later result shows the reference, since no step really runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3: publishing needs a dry run); ADR 0270 (decision 6); ADR 0152 (decision
 *                     6: test runs); ADR 0331 (decisions 6 and 7).
 */
import { type Condition, evaluate } from "@stackra/rules";

import { BUILDING_BLOCKS } from "#core/constants/building-blocks.constant";
import { DryRunOutcome } from "#core/enums/dry-run-outcome.enum";
import { checkAutomation } from "#core/functions/check-automation.function";
import { correlationKey } from "#core/functions/correlation-key.function";
import { factsOf } from "#core/functions/facts-of.function";
import { lookupRef } from "#core/functions/lookup-ref.function";
import { resolveRefs } from "#core/functions/resolve-refs.function";
import { triggerRules } from "#core/functions/trigger-rules.function";
import type { DryRun } from "#core/types/dry-run.type";
import type { DryRunStep } from "#core/types/dry-run-step.type";

/**
 * The dry run of `document` on `input` at `options.now`.
 *
 * @throws AutomationInvalidError when the document does not check (see `checkAutomation`).
 * @example
 * const report = dryRun(document, { orderId: "ord_1", total: 120 }, { now: ctx.now() });
 * report.steps.map((step) => step.outcome); // ["run", "skip", "wait"]
 */
export function dryRun(document: unknown, input: unknown, options: { readonly now: Date }): DryRun {
  const checked = checkAutomation(document);
  const trigger =
    checked.trigger === undefined ? undefined : BUILDING_BLOCKS.get(checked.trigger.block);
  const roots = { input, results: {} };
  const steps = checked.steps.map((step): DryRunStep => {
    const evaluation =
      step.when === undefined || trigger === undefined
        ? undefined
        : // reason: `checkAutomation` checked `when` against the trigger's facts
          evaluate(triggerRules(trigger), step.when as Condition, factsOf(trigger, input), {
            now: options.now,
          });
    const correlation =
      step.waitFor === undefined ? undefined : lookupRef(step.waitFor.correlate, roots);
    return Object.freeze({
      name: step.name,
      ...(step.block === undefined ? {} : { block: step.block }),
      outcome:
        evaluation?.matched === false
          ? DryRunOutcome.Skip
          : step.waitFor === undefined
            ? DryRunOutcome.Run
            : DryRunOutcome.Wait,
      input: resolveRefs(step.input, roots, true),
      ...(step.waitFor === undefined
        ? {}
        : {
            waitsFor: {
              block: step.waitFor.block,
              correlate: step.waitFor.correlate,
              ...(correlation === undefined ? {} : { correlation: correlationKey(correlation) }),
            },
          }),
      ...(evaluation === undefined ? {} : { evaluation }),
    });
  });
  return Object.freeze({ key: checked.key, version: checked.version, steps: Object.freeze(steps) });
}
