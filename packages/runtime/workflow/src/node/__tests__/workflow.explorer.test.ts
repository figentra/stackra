/**
 * Stackra file contract:
 * Purpose: unit tests of `WorkflowExplorer`: at boot it connects the native engine, plans each built workflow (so a bad
 *          plan fails at boot), subscribes a starter for each `startOn` workflow that starts a run with the event (its
 *          origin naming no scope), and refuses a `startOn` workflow when no event bus is bound; it leaves another
 *          engine alone. It subscribes each trigger block: an occurrence is held for waiting runs under the block's
 *          correlation and starts each published automation as its principal, keyed by automation and occurrence; a
 *          coded step waiting for an event no trigger block correlates fails boot.
 * Boundary: test only; a stand-in container lists fixed instances and binds a recording bus; the engine runs on the
 *           memory journal.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0144 (explorers); ADR 0101 (0294 note: `startOn`).
 */
import type { WorkflowRunner } from "@stackra/actions/contracts";
import { Explorer } from "@stackra/container";
import type { AnyClass, Container } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { DomainEvent, EventBus } from "@stackra/events";
import type { Listener, ListenerContext } from "@stackra/events";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  BlockKind,
  MemoryWorkflowJournalDriver,
  NativeWorkflowRunnerDriver,
  registerBlocks,
  Step,
  Workflow,
} from "#core/index";
import { AutomationService } from "#node/services/automation.service";
import { WorkflowExplorer } from "#node/workflow.explorer";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

class PaymentCaptured {
  orderId!: string;
}

class FulfilWorkflow extends Workflow({ startOn: PaymentCaptured }) {
  readonly started: string[] = [];

  async allocate(run: { readonly input: PaymentCaptured }): Promise<void> {
    this.started.push(run.input.orderId);
  }
}

class OrphanUndoWorkflow extends Workflow({}) {
  async undoShip(): Promise<void> {}
}

/** A container over `instances`, with `bus` bound when given. */
function containerOf(instances: readonly object[], bus?: object): Container {
  return {
    instances: () => instances,
    has: (token: AnyClass) => bus !== undefined && token === EventBus,
    get: (token: AnyClass) => {
      if (token === EventBus && bus !== undefined) return bus;
      const found = instances.find((instance) => instance.constructor === token);
      if (found === undefined) throw new Error(`${token.name} is not bound`);
      return found;
    },
  } as unknown as Container;
}

/** A native engine on the memory journal. */
const engine = () =>
  new NativeWorkflowRunnerDriver(
    new MemoryWorkflowJournalDriver(),
    new Locks(new MemoryLockDriver(), clock),
    clock,
  );

describe(WorkflowExplorer, () => {
  it("is an explorer", () => {
    expect(new WorkflowExplorer(containerOf([]), engine())).toBeInstanceOf(Explorer);
  });

  it("connects the engine and starts a startOn workflow with each event", async () => {
    const subscriptions: [AnyClass, Listener][] = [];
    const bus = {
      subscribe: (type: AnyClass, listener: Listener) => subscriptions.push([type, listener]),
    };
    const fulfil = new FulfilWorkflow();
    const runner = engine();
    new WorkflowExplorer(containerOf([fulfil], bus), runner).onApplicationBootstrap();

    // the trigger blocks this file registers are subscribed too
    const starters = subscriptions.filter(([type]) => type === PaymentCaptured);
    expect(starters).toHaveLength(1);
    const [subscription] = starters;
    if (subscription === undefined) throw new Error("the explorer subscribed a starter");
    const [type, starter] = subscription;
    expect(type).toBe(PaymentCaptured);
    const ctx = {
      eventId: "evt_1",
      occurredAt: NOON,
      tenantId: "scp_1",
      now: () => NOON,
    } as ListenerContext;
    await (
      starter as unknown as { handle(event: object, context: ListenerContext): Promise<void> }
    ).handle(Object.assign(new PaymentCaptured(), { orderId: "ord_1" }), ctx);

    expect(fulfil.started).toEqual(["ord_1"]);
    const origin = (await runner.last(FulfilWorkflow))?.origin;
    expect(origin).toMatchObject({
      callId: "evt_1",
      actor: { kind: "system", id: "sys_workflow" },
    });
    // The envelope's scope id is not a ScopeRef: the run takes its scope from the session, never from the event.
    expect(origin).not.toHaveProperty("tenantId");
    expect(origin).not.toHaveProperty("scope");
  });

  it("refuses a startOn workflow with no event bus, and a bad plan, at boot", () => {
    expect(() =>
      new WorkflowExplorer(containerOf([new FulfilWorkflow()]), engine()).onApplicationBootstrap(),
    ).toThrow(/no EventBus is bound/);
    expect(() =>
      new WorkflowExplorer(
        containerOf([new OrphanUndoWorkflow()]),
        engine(),
      ).onApplicationBootstrap(),
    ).toThrow(TypeError);
  });

  it("leaves another engine alone", () => {
    const other = {
      run: async () => undefined,
      signal: async () => undefined,
    } as unknown as WorkflowRunner;
    expect(() =>
      new WorkflowExplorer(containerOf([new OrphanUndoWorkflow()]), other).onApplicationBootstrap(),
    ).not.toThrow();
  });
});

describe("WorkflowExplorer trigger blocks", () => {
  class OrderPaid extends DomainEvent {
    orderId!: string;
  }

  class OrderRefunded extends DomainEvent {}

  class AwaitRefundWorkflow extends Workflow({}) {
    @Step({ waitFor: OrderRefunded, correlate: () => "ord_1" })
    async refunded(): Promise<void> {}
  }

  registerBlocks([
    {
      key: "orders.order_paid",
      kind: BlockKind.Trigger,
      type: OrderPaid,
      label: "orders::blocks.paid",
      correlate: (event: OrderPaid) => event.orderId,
    },
  ]);

  const PRINCIPAL = { kind: "system", id: "sys_automation" };

  const DOCUMENT = { key: "commerce.thanks", steps: [] };

  it("holds each occurrence and starts the published automations it triggers", async () => {
    const subscriptions: [AnyClass, Listener][] = [];
    const bus = {
      subscribe: (type: AnyClass, listener: Listener) => subscriptions.push([type, listener]),
    };
    const automations = {
      triggered: async () => [{ automationId: "wfa_1", document: DOCUMENT, principal: PRINCIPAL }],
    };
    const container = {
      instances: () => [],
      has: (token: AnyClass) => token === EventBus || token === AutomationService,
      get: (token: AnyClass) => (token === EventBus ? bus : automations),
    } as unknown as Container;
    const runner = engine();
    const hold = vi.spyOn(runner, "hold").mockResolvedValue(undefined);
    const start = vi.spyOn(runner, "startDocument").mockResolvedValue(undefined);
    new WorkflowExplorer(container, runner).onApplicationBootstrap();

    const [type, listener] = subscriptions.find(([candidate]) => candidate === OrderPaid) ?? [];
    expect(type).toBe(OrderPaid);
    const event = Object.assign(new OrderPaid(), { orderId: "ord_1" });
    const ctx = { eventId: "evt_1", occurredAt: NOON, now: () => NOON } as ListenerContext;
    await (listener as unknown as { handle(e: object, c: ListenerContext): Promise<void> }).handle(
      event,
      ctx,
    );

    expect(hold).toHaveBeenCalledWith(OrderPaid, event, "ord_1");
    expect(start).toHaveBeenCalledWith(
      DOCUMENT,
      event,
      expect.objectContaining({ callId: "evt_1", key: "commerce.thanks", actor: PRINCIPAL }),
      { key: "wfa_1:evt_1" },
    );
  });

  it("fails boot for a step that waits for an event no trigger block correlates", () => {
    expect(() =>
      new WorkflowExplorer(
        containerOf([new AwaitRefundWorkflow()]),
        engine(),
      ).onApplicationBootstrap(),
    ).toThrow(/no trigger block correlates/);
  });
});
