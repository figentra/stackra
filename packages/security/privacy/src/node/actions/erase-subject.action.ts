/**
 * Stackra file contract:
 * Purpose: `EraseSubjectAction`, `privacy.subject.erase@1`: starts `EraseSubjectWorkflow` for one erasure request
 *          and answers with its receipt.
 * Boundary: a system job (one run per request on the default queue, an hour at most): the request flow that verified
 *           the person and the deadline (PDPL and GDPR answer within a month) dispatches it, so it gets no endpoint and
 *           no tool. Its permission `privacy.subject.erase` is derived, a system permission no role grants.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2); ADR 0294 (decisions 16, 18 and 21); ADR 0305 (rule 28: the job surface);
 *                     ADR 0101 (only an action or `startOn` starts a run); STA-1375.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { EraseSubjectInput } from "#node/schemas/erase-subject-input.schema";
import type { EraseSubjectOutput } from "#node/schemas/erase-subject-output.schema";
import { EraseSubjectWorkflow } from "#node/workflows/erase-subject.workflow";

/**
 * Erases one subject.
 *
 * @example
 * const receipt = await pipeline.execute(EraseSubjectAction, { erasureId, subject }, { actor: systemActor });
 */
export class EraseSubjectAction extends Action({
  key: "subject.erase",
  actors: [ActorKind.System],
  job: { unique: true, timeout: "1h", retries: 3 },
}) {
  /** Starts the erasure run and returns its receipt through the same pipeline. */
  async handle(input: EraseSubjectInput, ctx: ActionContext): Promise<EraseSubjectOutput> {
    return ctx.run<EraseSubjectOutput>(EraseSubjectWorkflow, input);
  }
}
