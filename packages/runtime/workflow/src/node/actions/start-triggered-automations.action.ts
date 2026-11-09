/**
 * Stackra file contract:
 * Purpose: `workflow.automation.start_triggered@1`, the queued start of the automations one trigger occurrence starts:
 *          the trigger listener pushes it in the delivery's transaction, and the queue runs it, retried while a
 *          tenant's automation quota cannot be read; on its last attempt an unreadable quota records
 *          `quota_unavailable` instead, so no occurrence is lost and none is retried forever.
 * Boundary: a job only: no user or agent actor, so no endpoint and no tool. It runs as the workflow's system actor
 *           in the delivery's scope, which the listener pushed with it (the isolation resolves the tenant from it), so
 *           `AutomationService.triggered` reads the same automations the delivery would have; each run still acts as
 *           its automation's principal. Each start is keyed by the automation and the event, so a
 *           retry starts nothing twice. `ctx.attempt` tells the last attempt; a direct call has none and counts as last.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decisions 1 and 2); ADR 0305 (rule 28: the job surface).
 */
import { Action, type ActionContext } from "@stackra/actions";
import type { WorkflowRunner } from "@stackra/actions/contracts";
import { ActorKind, Backoff } from "@stackra/contracts";

import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { startTriggered } from "#node/functions/start-triggered.function";
import type { StartTriggeredAutomationsInput } from "#node/schemas/start-triggered-automations-input.schema";
import type { AutomationService } from "#node/services/automation.service";

/**
 * Starts the automations of one trigger occurrence, as a retried job.
 *
 * @example
 * await queue.push(StartTriggeredAutomationsAction, { block, eventId, occurrence }, { origin: system, scope });
 */
export class StartTriggeredAutomationsAction extends Action({
  key: "automation.start_triggered",
  actors: [ActorKind.System, ActorKind.Job],
  job: { queue: "default", retries: 6, backoff: Backoff.Exponential, deadLetter: true },
}) {
  /** The automations and their quota. */
  private readonly automations: AutomationService;

  /** The bound engine. */
  private readonly runner: WorkflowRunner;

  /**
   * @param automations - the automations a trigger starts.
   * @param runner - the bound engine; only the native engine starts automations.
   */
  constructor(automations: AutomationService, runner: WorkflowRunner) {
    super();
    this.automations = automations;
    this.runner = runner;
  }

  /**
   * Starts each automation the occurrence triggers.
   *
   * @throws AutomationQuotaUnavailableError on an attempt a retry follows, when a quota cannot be read.
   * @throws AggregateError when one or more automations failed to start.
   */
  async handle(input: StartTriggeredAutomationsInput, ctx: ActionContext): Promise<void> {
    if (!(this.runner instanceof NativeWorkflowRunnerDriver)) return;
    await startTriggered(
      this.runner,
      this.automations,
      {
        block: input.block,
        eventId: input.eventId,
        ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId }),
        input: input.occurrence,
      },
      { last: ctx.attempt?.last ?? true },
    );
  }
}
