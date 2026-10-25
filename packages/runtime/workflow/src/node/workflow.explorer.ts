/**
 * Stackra file contract:
 * Purpose: `WorkflowExplorer`, the boot step of the workflow package: it connects the native engine to the container,
 *          reads the plan of every workflow the container built (so a bad `@Step`, undo or `after` fails at boot, not on
 *          the first run, and every workflow is registered for resume), and subscribes a starter for each `startOn`
 *          workflow to the event bus.
 * Boundary: runs once per container, after every singleton is built. It acts only when the bound `WorkflowRunner` is
 *           the native engine; another engine driver wires itself. A starter is an in-process subscription built here,
 *           not a `Listener` kind file, so gen never wires it to every event; the run it starts names no scope and
 *           takes the session's from the engine. The runtime still runs `work` (the worker loop) per service.
 * Runtime: node
 * Governing contract: ADR 0144 (explorers) as amended by 0263; ADR 0294 (decision 6: the kind acts on what decorators
 *                     recorded); ADR 0101 (0294 note: an event starts a workflow only through `startOn`); ADR 0102
 *                     (decision 7: workflows are resolved through the container).
 */
import type { WorkflowRunner } from "@stackra/actions/contracts";
import { Explorer, kindOf } from "@stackra/container";
import type { AnyClass, Container } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { EventBus, Listener } from "@stackra/events";
import type { Event, ListenerContext } from "@stackra/events";

import { NativeWorkflowRunnerDriver } from "#core/index";
import type { RunOrigin } from "#core/index";
import { WORKFLOW_DEFAULTS } from "#core/constants/workflow-defaults.constant";
import { planOf } from "#core/functions/plan-of.function";

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
   * @throws TypeError for a workflow whose plan is invalid; Error for a `startOn` workflow with no event bus bound.
   */
  onApplicationBootstrap(): void {
    const { runner, container } = this;
    if (!(runner instanceof NativeWorkflowRunnerDriver)) return;
    runner.connect(container);
    for (const instance of container.instances()) {
      const type = instance.constructor as AnyClass;
      if (kindOf(type)?.kind !== "workflow") continue;
      const plan = planOf(type);
      if (plan.startOn === undefined) continue;
      if (!container.has(EventBus))
        throw new Error(`${type.name} starts on ${plan.startOn.name}, but no EventBus is bound`);
      container
        .get(EventBus)
        .subscribe(plan.startOn as AnyClass<Event>, starterOf(runner, type, plan.key));
    }
  }
}
