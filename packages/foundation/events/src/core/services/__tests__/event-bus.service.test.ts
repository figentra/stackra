/**
 * Stackra file contract:
 * Purpose: unit tests of `EventBus`: a dispatched event reaches each listener subscribed to its class (or a parent)
 *          once per drain with its context; a failing listener is recorded and never stops the others or the drain;
 *          an event dispatched by a listener runs in the same drain; `deliver` queues without publishing; metadata
 *          given is kept and the rest defaulted; subscriptions are kept once; `connect` subscribes the registered
 *          listeners a container binds; `disconnect` removes only those.
 * Boundary: test only; a fixed clock stands in for the Clock port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0078 (decisions 1 to 4); ADR 0294 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { DomainEvent } from "#core/bases/domain-event.base";
import { Listener } from "#core/bases/listener.base";
import { LISTENER_REGISTRY } from "#core/constants/listener-registry.constant";
import { registerListeners } from "#core/functions/register-listeners.function";
import { EventBus } from "#core/services/event-bus.service";
import type { ListenerContext } from "#core/types/listener-context.type";

const NOW = new Date("2026-10-24T09:00:00Z");

const clock = { now: () => new Date(NOW) } as Clock;

class StockChanged extends DomainEvent {}

class StockLow extends StockChanged {}

class OrderPaid extends DomainEvent {}

class RecordingListener extends Listener {
  readonly seen: { event: unknown; ctx: ListenerContext }[] = [];

  async handle(event: StockChanged, ctx: ListenerContext): Promise<void> {
    this.seen.push({ event, ctx });
  }
}

class FailingListener extends Listener {
  async handle(_event: StockLow): Promise<void> {
    throw new RangeError("ledger offline");
  }
}

beforeEach(() => {
  LISTENER_REGISTRY.clear();
});

describe(EventBus, () => {
  it("delivers a dispatched event to its listeners with the context", async () => {
    const bus = new EventBus(clock);
    const listener = new RecordingListener();
    bus.subscribe(StockChanged, listener);
    const event = new StockLow();
    const record = bus.dispatch(event, { tenantId: "tnt_1", correlationId: "cor_1" });

    expect(listener.seen).toEqual([]);
    const deliveries = await bus.drain();

    expect(deliveries).toEqual([{ listener, record }]);
    expect(listener.seen).toHaveLength(1);
    const [{ event: received, ctx }] = listener.seen as [{ event: unknown; ctx: ListenerContext }];
    expect(received).toBe(event);
    expect(ctx.eventId).toBe(record.meta.id);
    expect(ctx.eventId).toMatch(/^evt_/);
    expect(ctx.occurredAt).toEqual(NOW);
    expect(ctx.tenantId).toBe("tnt_1");
    expect(ctx.correlationId).toBe("cor_1");
    expect(ctx.now()).toEqual(NOW);
    expect(await bus.drain()).toEqual([]);
  });

  it("skips listeners of another class", async () => {
    const bus = new EventBus(clock);
    const listener = new RecordingListener();
    bus.subscribe(OrderPaid, listener);
    bus.dispatch(new StockLow());
    expect(await bus.drain()).toEqual([]);
  });

  it("records a failure without stopping the other listeners", async () => {
    const bus = new EventBus(clock);
    const failing = new FailingListener();
    const recording = new RecordingListener();
    bus.subscribe(StockLow, failing);
    bus.subscribe(StockLow, recording);
    bus.dispatch(new StockLow());

    const deliveries = await bus.drain();

    expect(deliveries).toHaveLength(2);
    expect(deliveries[0]?.error).toBeInstanceOf(RangeError);
    expect("error" in (deliveries[1] ?? {})).toBe(false);
    expect(recording.seen).toHaveLength(1);
    expect(bus.deliveries()).toEqual(deliveries);
  });

  it("runs an event a listener dispatches in the same drain", async () => {
    const bus = new EventBus(clock);
    const recording = new RecordingListener();
    class ChainListener extends Listener {
      async handle(_event: OrderPaid): Promise<void> {
        bus.dispatch(new StockLow());
      }
    }
    bus.subscribe(OrderPaid, new ChainListener());
    bus.subscribe(StockChanged, recording);
    bus.dispatch(new OrderPaid());

    expect(await bus.drain()).toHaveLength(2);
    expect(recording.seen).toHaveLength(1);
  });

  it("publishes what it dispatches, not what it delivers", async () => {
    const bus = new EventBus(clock);
    const recording = new RecordingListener();
    bus.subscribe(StockChanged, recording);
    const dispatched = bus.dispatch(new StockLow());
    const delivered = bus.deliver(new StockLow(), { id: "evt_remote", occurredAt: new Date(0) });

    expect(bus.published()).toEqual([dispatched]);
    expect(delivered.meta).toEqual({ id: "evt_remote", occurredAt: new Date(0) });
    expect(Object.isFrozen(delivered)).toBe(true);
    expect(Object.isFrozen(delivered.meta)).toBe(true);
    await bus.drain();
    expect(recording.seen).toHaveLength(2);
  });

  it("keeps a subscription once", async () => {
    const bus = new EventBus(clock);
    const recording = new RecordingListener();
    bus.subscribe(StockLow, recording);
    bus.subscribe(StockLow, recording);
    bus.dispatch(new StockLow());
    expect(await bus.drain()).toHaveLength(1);
  });

  it("connects the registered listeners a container binds", async () => {
    const bound = new RecordingListener();
    registerListeners([
      [StockLow, RecordingListener],
      [StockLow, FailingListener],
    ]);
    const container = {
      has: (type: AnyClass) => type === RecordingListener,
      get: <T extends object>(_type: AnyClass<T>): T => bound as unknown as T,
    };
    const bus = new EventBus(clock);
    bus.connect(container);
    bus.dispatch(new StockLow());

    const deliveries = await bus.drain();

    expect(deliveries.map((delivery) => delivery.listener)).toEqual([bound]);
  });

  it("disconnects the listeners connect subscribed and keeps direct subscriptions", async () => {
    const bound = new RecordingListener();
    const direct = new RecordingListener();
    registerListeners([[OrderPaid, RecordingListener]]);
    const container = {
      has: (type: AnyClass) => type === RecordingListener,
      get: <T extends object>(_type: AnyClass<T>): T => bound as unknown as T,
    };
    const bus = new EventBus(clock);
    bus.connect(container);
    bus.subscribe(OrderPaid, direct);
    bus.disconnect();
    bus.dispatch(new OrderPaid());

    const deliveries = await bus.drain();

    expect(deliveries.map((delivery) => delivery.listener)).toEqual([direct]);
  });
});
