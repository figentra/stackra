/**
 * Stackra file contract:
 * Purpose: `EventBus`, the in-process bus: the unit of work dispatches the domain events of a commit to it, the
 *          outbox relay and the inbox deliver integration events through it, and `drain()` hands each queued event to
 *          every listener subscribed to its class.
 * Boundary: a listener failure is recorded on its delivery and never reaches the emitter or the other listeners
 *           (ADR 0078 decisions 1 and 2). It runs each delivery once: retries and queues belong to the queue driver
 *           behind a queued listener. It never writes to the outbox and never deduplicates; the inbox does that by
 *           event id. `connect` subscribes the listeners gen registered, resolved from a container; `disconnect` (the
 *           boot calls it on shutdown) removes exactly those, leaving direct `subscribe` calls in place.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decisions 1 to 4); ADR 0294 (decisions 4 and 27); ADR 0305 (rule 21); ADR 0263 (connected after the
 *                     container is ready, disconnected on shutdown).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import type { EventMeta } from "#contracts/types/event-meta.type";
import type { RecordedEvent } from "#contracts/types/recorded-event.type";
import type { Event } from "#core/bases/event.base";
import type { Listener } from "#core/bases/listener.base";
import { LISTENER_REGISTRY } from "#core/constants/listener-registry.constant";
import { newEventId } from "#core/functions/new-event-id.function";
import type { ListenerContext } from "#core/types/listener-context.type";
import type { ListenerDelivery } from "#core/types/listener-delivery.type";

/** One listener subscribed to one event class. */
interface Subscription {
  readonly type: AnyClass;
  readonly listener: Listener;
}

/**
 * The in-process event bus.
 *
 * @example
 * bus.connect(container);
 * bus.dispatch(PointsRedeemed.create({ memberId, points, reference }), { scopeId, actor });
 * const deliveries = await bus.drain();
 */
export class EventBus extends Service {
  /** Reads "now" for an occurrence without a time and for `ctx.now()`. */
  private readonly clock: Clock;

  /** Subscriptions in subscription order. */
  private readonly subscriptions: Subscription[] = [];

  /** The subscriptions `connect` made, which `disconnect` removes. */
  private readonly connected: Subscription[] = [];

  /** Occurrences waiting for `drain()`, oldest first. */
  private readonly queue: RecordedEvent<Event>[] = [];

  /** Every occurrence dispatched in process, oldest first. */
  private readonly log: RecordedEvent<Event>[] = [];

  /** Every delivery made, oldest first. */
  private readonly history: ListenerDelivery[] = [];

  /**
   * @param clock - the Clock port.
   */
  constructor(clock: Clock) {
    super();
    this.clock = clock;
  }

  /**
   * Subscribes `listener` to every event of `type` (and of its subclasses); subscribing a pair again does nothing.
   * `type` is a local event class or a consumed service's generated one, matched by `instanceof`.
   */
  subscribe(type: AnyClass, listener: Listener): void {
    if (!this.subscriptions.some((known) => known.type === type && known.listener === listener))
      this.subscriptions.push({ type, listener });
  }

  /**
   * Subscribes every registered listener that `container` binds, built by it.
   *
   * @param container - a container or a testing app; listeners of modules it did not boot are skipped.
   */
  connect(container: {
    has(type: AnyClass): boolean;
    get<T extends object>(type: AnyClass<T>): T;
  }): void {
    for (const [type, listeners] of LISTENER_REGISTRY)
      for (const listener of listeners) {
        if (!container.has(listener)) continue;
        const instance = container.get(listener);
        if (this.subscriptions.some((known) => known.type === type && known.listener === instance))
          continue;
        const subscription = { type, listener: instance };
        this.subscriptions.push(subscription);
        this.connected.push(subscription);
      }
  }

  /** Removes the subscriptions `connect` made; queued occurrences stay queued. */
  disconnect(): void {
    for (const subscription of this.connected.splice(0))
      this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1);
  }

  /**
   * Publishes `event` in process: queues it for `drain()` and keeps it in `published()`.
   *
   * @param meta - the occurrence's metadata; a fresh id and the clock's time when absent.
   * @returns the queued occurrence.
   */
  dispatch(event: Event, meta: Partial<EventMeta> = {}): RecordedEvent<Event> {
    const record = this.deliver(event, meta);
    this.log.push(record);
    return record;
  }

  /**
   * Queues an occurrence published elsewhere (relayed from the outbox, received by the inbox) for `drain()` without
   * publishing it again.
   *
   * @param meta - the occurrence's metadata; a fresh id and the clock's time when absent.
   * @returns the queued occurrence.
   */
  deliver(event: Event, meta: Partial<EventMeta> = {}): RecordedEvent<Event> {
    const record: RecordedEvent<Event> = Object.freeze({
      event,
      meta: Object.freeze({
        ...meta,
        id: meta.id ?? newEventId(),
        occurredAt: meta.occurredAt ?? this.clock.now(),
      }),
    });
    this.queue.push(record);
    return record;
  }

  /**
   * Hands every queued occurrence to each listener subscribed to its class, in subscription order, until the queue is
   * empty (an event a listener dispatches meanwhile runs in the same drain). Never rejects.
   *
   * @returns the deliveries this drain made, failures included.
   */
  async drain(): Promise<readonly ListenerDelivery[]> {
    const deliveries: ListenerDelivery[] = [];
    for (let record = this.queue.shift(); record !== undefined; record = this.queue.shift())
      for (const { type, listener } of this.subscriptions)
        if (record.event instanceof type) {
          const delivery = await this.run(listener, record);
          deliveries.push(delivery);
          this.history.push(delivery);
        }
    return deliveries;
  }

  /** Every occurrence dispatched in process so far, oldest first. */
  published(): readonly RecordedEvent<Event>[] {
    return [...this.log];
  }

  /** Every delivery made so far, oldest first. */
  deliveries(): readonly ListenerDelivery[] {
    return [...this.history];
  }

  /** Runs one delivery and records how it ended. */
  private async run(listener: Listener, record: RecordedEvent<Event>): Promise<ListenerDelivery> {
    const { id, ...meta } = record.meta;
    const context: ListenerContext = { ...meta, eventId: id, now: () => this.clock.now() };
    try {
      await listener.handle(record.event as never, context);
      return Object.freeze({ listener, record });
    } catch (error) {
      return Object.freeze({ listener, record, error });
    }
  }
}
