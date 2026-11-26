/**
 * Stackra file contract:
 * Purpose: `workflow.run.get@1`, the pull path beside a run's events (STA-2613): an interactive caller whose `ctx.run`
 *          answered while the run parked (a wait or a retry) reads the run's status and its workflow's output until it
 *          ends, as Pay's hosted page does for a charge.
 * Boundary: L1 and tenant-scoped. The run must sit at or below the caller's scope, and the caller must be the person
 *           who started it (an agent acting for them counts) or a service; anything else, including a run of another
 *           tenant, is `run_not_found`, so a run's existence never leaks. It answers the status, the end time and the
 *           workflow's `output` only: never the steps, their results, the input or the error.
 * Runtime: node
 * Governing contract: ADR 0101 (`ctx.run`); ADR 0102 (decision 1: the journal); ADR 0208; STA-2613.
 */
import { Query, type QueryContext } from "@stackra/actions";
import type { WorkflowRunner } from "@stackra/actions/contracts";
import { type Actor, ActorKind, type ScopeRef } from "@stackra/contracts";

import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { RunNotFoundError } from "#core/errors/run-not-found.error";
import type { WorkflowRun } from "#core/types/workflow-run.type";
import type { GetRunInput } from "#node/schemas/get-run-input.schema";
import { GetRunOutput } from "#node/schemas/get-run-output.schema";

/** The end of `actor`'s on-behalf-of chain: the person (or principal) the call is for. */
const principalOf = (actor: Actor): Actor => {
  let link = actor;
  while (link.onBehalfOf !== undefined) link = link.onBehalfOf;
  return link;
};

/** Whether `inner` is `outer` or below it in the scope tree. */
const within = (inner: ScopeRef | undefined, outer: ScopeRef | undefined): boolean =>
  outer === undefined
    ? inner === undefined
    : inner !== undefined && (inner.path === outer.path || inner.path.startsWith(`${outer.path}.`));

/**
 * Reads one run the caller started.
 *
 * @example
 * const { status, output } = await pipeline.execute(GetRunQuery, { runId }, { actor });
 */
export class GetRunQuery extends Query({
  key: "run.get",
  actors: [ActorKind.User, ActorKind.Agent, ActorKind.Service],
}) {
  /** The bound engine. */
  private readonly runner: WorkflowRunner;

  /**
   * @param runner - the bound engine; only the native one keeps a journal this query reads.
   */
  constructor(runner: WorkflowRunner) {
    super();
    this.runner = runner;
  }

  /**
   * The run's status and output.
   *
   * @throws RunNotFoundError when no run has the id, or the caller may not see it.
   */
  async handle(input: GetRunInput, ctx: QueryContext): Promise<GetRunOutput> {
    const view =
      this.runner instanceof NativeWorkflowRunnerDriver
        ? await this.runner.view(input.runId)
        : undefined;
    if (view === undefined || !visible(view.run, ctx))
      throw RunNotFoundError.create({ runId: input.runId });
    return GetRunOutput.create({
      runId: view.run.id,
      status: view.run.status,
      endedAt: view.run.endedAt ?? null,
      output: (view.output ?? null) as GetRunOutput["output"],
    });
  }
}

/** Whether the caller of `ctx` may see `run`: in its scope, and its starter or a service. */
function visible(run: WorkflowRun, ctx: QueryContext): boolean {
  // The journal's scope of the run, else the starting call's (a journal with no scope session keeps only the latter).
  if (!within(run.scope ?? run.origin.scope, ctx.scope)) return false;
  if (ctx.actor.kind === ActorKind.Service) return true;
  const caller = principalOf(ctx.actor);
  const starter = principalOf(run.origin.actor);
  return caller.kind === starter.kind && caller.id === starter.id;
}
