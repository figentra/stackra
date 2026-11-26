/**
 * Stackra file contract:
 * Purpose: `WorkflowExplorer`, the boot step of the workflow package: it connects the native engine to the container,
 *          reads the plan of every workflow the container built (so a bad `@Step`, undo or `after` fails at boot, not
 *          on the first run, and every workflow is registered for resume), subscribes a starter for each `startOn`
 *          workflow to the event bus, and subscribes each trigger building block: its occurrences are held for the runs
 *          that wait on them (when it correlates), and start the published automations it triggers; and, when
 *          `ServiceAckService` is bound, subscribes `ServiceAcked`, holding `AllServicesAcked` (with what each service
 *          kept) for the subject once the last expected service acked.
 * Boundary: runs once per container, after every singleton is built. It acts only when the bound `WorkflowRunner` is
 *           the native engine; another engine driver wires itself. A starter is an in-process subscription built here,
 *           not a `Listener` kind file, so gen never wires it to every event; the run it starts names no scope and
 *           takes the session's from the engine. A trigger's listener reads the automations of the delivery's scope
 *           session (`AutomationService.triggered`, when bound) and starts each as its principal, keyed by the
 *           automation and the occurrence so a redelivery starts nothing twice, recorded as that automation's run, and
 *           placed in its event chain from the delivery's correlation (`NativeWorkflowRunnerDriver.chained`), so a
 *           chain past `workflow.maxChainDepth` or a loop back to an automation already in it starts nothing; one
 *           automation's failure does not stop the others (`startTriggered`). With a `QueueService` bound it pushes
 *           `StartTriggeredAutomationsAction` instead, in the delivery's transaction and scope, so a start whose quota
 *           cannot be read is retried by the queue and skipped only on its last attempt. A coded step that waits for an event needs a trigger block
 *           that correlates it, or boot fails. The runtime still runs `work` (the worker loop) per service.
 * Runtime: node
 * Governing contract: ADR 0144 (explorers) as amended by 0263; ADR 0294 (decision 6: the kind acts on what decorators
 *                     recorded); ADR 0101 (0294 note: an event starts a workflow only through `startOn`); ADR 0102
 *                     (decision 7: workflows are resolved through the container); ADR 0152 (decision 1: event waits);
 *                     ADR 0122 (decision 3); ADR 0153 (decisions 1 and 2); ADR 0210 (decision 6); ADR 0427 (decision
 *                     1); OS-232 (chain depth).
 */
import type { WorkflowRunner } from "@stackra/actions/contracts";
import { Explorer, kindOf } from "@stackra/container";
import type { AnyClass, Container } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Json, PublicId } from "@stackra/contracts";
import { EventBus, Listener } from "@stackra/events";
import type { Event, ListenerContext } from "@stackra/events";
import { QueueService } from "@stackra/queue";

import {
  AllServicesAcked,
  BlockKind,
  buildingBlocks,
  NativeWorkflowRunnerDriver,
  ServiceAcked,
  WorkflowJournal,
} from "#core/index";
import type { BuildingBlock, RunOrigin } from "#core/index";
import { WORKFLOW_DEFAULTS } from "#core/constants/workflow-defaults.constant";
import { planOf } from "#core/functions/plan-of.function";
import { StartTriggeredAutomationsAction } from "#node/actions/start-triggered-automations.action";
import { startTriggered } from "#node/functions/start-triggered.function";
import { AutomationService } from "#node/services/automation.service";
import { ServiceAckService } from "#node/services/service-ack.service";

/** The caller of a run an event without an actor starts. */
const SYSTEM_ACTOR = Object.freeze({ kind: ActorKind.System, id: "sys_workflow" as PublicId });

/**
 * The origin of a run the event of `ctx` starts: its correlation (else the event) and its actor (else the system). It
 * names no scope: the engine gives the run the scope of the session the delivery runs in.
 */
function originOf(ctx: ListenerContext, key: string): RunOrigin {
  return Object.freeze({
    callId: ctx.correlationId ?? ctx.eventId,
    key,
    actor: ctx.actor ?? SYSTEM_ACTOR,
    ...WORKFLOW_DEFAULTS.origin,
  });
}

/** A subscription that starts `workflow` with each event it receives. */
function starterOf(runner: NativeWorkflowRunnerDriver, workflow: AnyClass, key: string): Listener {
  return new (class extends Listener {
    async handle(event: Event, ctx: ListenerContext): Promise<void> {
      await runner.start(workflow, event, originOf(ctx, key));
    }
  })();
}

/** Where a trigger listener hands its occurrence to a queued, retried start, when the app binds a queue. */
interface TriggerQueue {
  readonly queue: QueueService;
  readonly journal: WorkflowJournal;
}

/**
 * A subscription for trigger `block`: holds each occurrence for the runs that wait on it, when the block correlates,
 * and starts each published automation it triggers in the delivery's scope. With a queue bound it pushes
 * `StartTriggeredAutomationsAction` in the delivery's transaction instead, in the delivery's scope, so a start whose
 * quota cannot be read is retried rather than skipped at once.
 */
function triggerOf(
  runner: NativeWorkflowRunnerDriver,
  block: BuildingBlock,
  automations: AutomationService | undefined,
  queued: TriggerQueue | undefined,
): Listener {
  return new (class extends Listener {
    async handle(event: Event, ctx: ListenerContext): Promise<void> {
      // shortcut: every occurrence of a correlating trigger is held for the hold period whether or not a run waits;
      // look up the waiting runs first once event volume makes `workflow.signals` grow.
      if (block.correlate !== undefined)
        await runner.hold(block.type, event, block.correlate(event as never));
      if (automations === undefined) return;
      const correlation =
        ctx.correlationId === undefined ? {} : { correlationId: ctx.correlationId };
      if (queued !== undefined) {
        const scope = await queued.journal.currentScope();
        await queued.queue.push(
          StartTriggeredAutomationsAction,
          {
            block: block.key,
            eventId: ctx.eventId,
            ...correlation,
            // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: the job's input is what the wire carries (Dates become strings)
            occurrence: JSON.parse(JSON.stringify(event)) as Json,
          },
          { origin: SYSTEM_ACTOR, ...(scope === undefined ? {} : { scope }) },
        );
        return;
      }
      await startTriggered(
        runner,
        automations,
        { block: block.key, eventId: ctx.eventId, ...correlation, input: event },
        { last: true },
      );
    }
  })();
}

/** A subscription that records each ack and holds `AllServicesAcked` once the set it completes is whole. */
function ackOf(runner: NativeWorkflowRunnerDriver, acks: ServiceAckService): Listener {
  return new (class extends Listener {
    async handle(event: Event): Promise<void> {
      const { subject, service, kept } = event as ServiceAcked;
      const completed = await acks.ack(subject, service, kept);
      if (completed !== undefined)
        await runner.hold(
          AllServicesAcked,
          { subject, services: [...completed.services], kept: { ...completed.kept } },
          { subject },
        );
    }
  })();
}

/**
 * Connects the engine and the `startOn` workflows at boot.
 *
 * @example
 * // generated wiring: { module: "workflow", kind: "explorer", provide: WorkflowExplorer, deps: [Container, WorkflowRunner] }
 */
export class WorkflowExplorer extends Explorer {
  /** The booted container. */
  private readonly container: Container;

  /** The bound engine. */
  private readonly runner: WorkflowRunner;

  /**
   * @param container - the root container, which builds the workflows and binds the event ports.
   * @param runner - the bound engine.
   */
  constructor(container: Container, runner: WorkflowRunner) {
    super();
    this.container = container;
    this.runner = runner;
  }

  /**
   * Connects the native engine, plans each built workflow and subscribes the `startOn` starters.
   *
   * @throws TypeError for a workflow whose plan is invalid, or a step that waits for an event no trigger block
   *         correlates; Error for a `startOn` workflow with no event bus bound.
   */
  onApplicationBootstrap(): void {
    const { runner, container } = this;
    if (!(runner instanceof NativeWorkflowRunnerDriver)) return;
    runner.connect(container);
    const triggers = buildingBlocks(BlockKind.Trigger);
    for (const instance of container.instances()) {
      const type = instance.constructor as AnyClass;
      if (kindOf(type)?.kind !== "workflow") continue;
      const plan = planOf(type);
      for (const step of plan.steps)
        if (
          step.waitFor !== undefined &&
          kindOf(step.waitFor)?.kind !== "signal" &&
          !triggers.some((block) => block.type === step.waitFor && block.correlate !== undefined)
        )
          throw new TypeError(
            `${type.name}.${step.name} waits for ${step.waitFor.name}, which no trigger block correlates`,
          );
      if (plan.startOn === undefined) continue;
      if (!container.has(EventBus))
        throw new Error(`${type.name} starts on ${plan.startOn.name}, but no EventBus is bound`);
      container
        .get(EventBus)
        .subscribe(plan.startOn as AnyClass<Event>, starterOf(runner, type, plan.key));
    }
    if (!container.has(EventBus)) return;
    const bus = container.get(EventBus);
    const automations = container.has(AutomationService)
      ? container.get(AutomationService)
      : undefined;
    const queued =
      container.has(QueueService) && container.has(WorkflowJournal)
        ? { queue: container.get(QueueService), journal: container.get(WorkflowJournal) }
        : undefined;
    for (const block of triggers)
      bus.subscribe(block.type as AnyClass<Event>, triggerOf(runner, block, automations, queued));
    if (container.has(ServiceAckService))
      bus.subscribe(ServiceAcked, ackOf(runner, container.get(ServiceAckService)));
  }
}
