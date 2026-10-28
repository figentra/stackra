/**
 * Stackra file contract:
 * Purpose: `runWorkflow`, the in-process test driver's start: it runs a workflow directly (without its action) on the
 *          current testing app's engine and resolves to its output or refusal and its journal record.
 * Boundary: test only; the workflow instance comes from the testing app, so its dependencies are the app's (fakes and
 *           overrides included). It runs as `options.as`, else a system test actor, in the pipeline's default locale,
 *           time zone, currency and market. Any error that is not a refusal propagates.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0151 (decision 6: the conformance suite runs the same workflows on
 *                     every driver); the STA-348 registry row (in-process test driver).
 */
import type { AnyClass } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";

import type { Run, Workflow } from "#core/index";
import { WORKFLOW_DEFAULTS } from "#core/constants/workflow-defaults.constant";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import type { WorkflowResult } from "#testing/types/workflow-result.type";

/** The caller of a run started without `as`. */
const TEST_ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: "sys_test" as PublicId });

/** What `output(run)` of `W` returns. */
type OutputOf<W> = W extends { output: (run: never) => infer O } ? O : undefined;

/**
 * Runs `type` with `input` on the current testing app's engine.
 *
 * @throws Error before any testing app compiled; any non-refusal error the run throws.
 * @example
 * const { ok, run } = await runWorkflow(CreateOrderWorkflow, input, { as: actors.customer() });
 * expect(run.steps.map((step) => step.status)).toEqual([StepStatus.Done, StepStatus.Done]);
 */
export async function runWorkflow<W extends Workflow>(
  type: AnyClass<W>,
  input: Run<W>["input"],
  options: { readonly as?: Actor } = {},
): Promise<WorkflowResult<OutputOf<W>>> {
  const harness = CURRENT_WORKFLOWS.value;
  if (harness === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before runWorkflow()",
    );
  const origin = {
    callId: globalThis.crypto.randomUUID(),
    key: type.name,
    actor: options.as ?? TEST_ACTOR,
    ...WORKFLOW_DEFAULTS.origin,
  };
  let output: unknown;
  let error: unknown;
  try {
    output = await harness.runner.start(type, input, origin);
  } catch (caughtError) {
    if (!isRefusal(caughtError)) throw caughtError;
    error = caughtError;
  }
  const run = await harness.runner.last(type);
  if (run === undefined) throw new Error(`${type.name} recorded no run`);
  return Object.freeze({
    ok: error === undefined,
    output: output as OutputOf<W> | undefined,
    error: isRefusal(error) ? error : undefined,
    run,
  });
}
