/**
 * Stackra file contract:
 * Purpose: `runDocument`, the in-process test driver's start of an automation document or an agent's plan: it runs the
 *          document on the current testing app's engine, each step an action call through the app's pipeline, and
 *          resolves to whether it ran, its refusal and its journal record.
 * Boundary: test only. It runs as `options.as`, else a system test actor, in the pipeline's default locale, time zone,
 *           currency and market, keyed by `options.key` (a fresh key otherwise), so the run is found by its derived
 *           id even when it compensated. A document that does not check rejects with `AutomationInvalidError`; any
 *           other error that is not a refusal propagates.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0122 (decision 3); ADR 0245 (decision 8: a plan is an ephemeral
 *                     workflow); ADR 0427 (decision 4).
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";

import { DOCUMENT_WORKFLOW } from "#core/constants/document-workflow.constant";
import { WORKFLOW_DEFAULTS } from "#core/constants/workflow-defaults.constant";
import { mintId } from "#core/functions/mint-id.function";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import type { WorkflowResult } from "#testing/types/workflow-result.type";

/** The caller of a document run started without `as`. */
const TEST_ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: "sys_test" as PublicId });

/**
 * Runs `document` with `input` (the trigger occurrence, or a plan's input) on the current testing app's engine.
 *
 * @throws Error before any testing app compiled; AutomationInvalidError for a document that does not check; any
 *         non-refusal error the run throws.
 * @example
 * const { ok, run } = await runDocument(COD_CONFIRMATION, { orderId: "ord_1", total: 250 }, { as: principal });
 * expect(run.steps.map((step) => step.status)).toEqual([StepStatus.Done, StepStatus.Waiting]);
 */
export async function runDocument(
  document: unknown,
  input: unknown,
  options: { readonly as?: Actor; readonly key?: string } = {},
): Promise<WorkflowResult<undefined>> {
  const harness = CURRENT_WORKFLOWS.value;
  if (harness === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before runDocument()",
    );
  const key = options.key ?? globalThis.crypto.randomUUID();
  const origin = {
    callId: globalThis.crypto.randomUUID(),
    key: DOCUMENT_WORKFLOW,
    actor: options.as ?? TEST_ACTOR,
    ...WORKFLOW_DEFAULTS.origin,
  };
  let error: unknown;
  try {
    await harness.runner.startDocument(document, input, origin, { key });
  } catch (caughtError) {
    if (!isRefusal(caughtError) || (await harness.runner.find(await idOf(key))) === undefined)
      throw caughtError;
    error = caughtError;
  }
  const run = await harness.runner.find(await idOf(key));
  if (run === undefined) throw new Error(`the document run keyed ${key} recorded no run`);
  return Object.freeze({
    ok: error === undefined,
    output: undefined,
    error: isRefusal(error) ? error : undefined,
    run,
  });
}

/** The run id the engine derives for a document run keyed `key`. */
function idOf(key: string): Promise<PublicId<"wfr">> {
  return mintId("wfr", `${DOCUMENT_WORKFLOW}:${key}`);
}
