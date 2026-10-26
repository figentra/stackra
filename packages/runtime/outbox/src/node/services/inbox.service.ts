/**
 * Stackra file contract:
 * Purpose: `InboxService`, the consumer side of an integration event: it rebuilds the event from its envelope, claims
 *          the event id and, only on the first claim, hands the event to the in-process bus and drains it, all in one
 *          transaction in the event's scope, so a redelivered event runs its listeners once.
 * Boundary: a platform service over the `InboxDriver` port, @stackra/events' `EventBus`, the `Database` and the
 *           `Clock`. The generated subscription of a consuming service calls `receive`, and so does the in-process
 *           publisher. An unknown wire name is refused before the claim, so the event stays unreceived for a later
 *           release. A failing listener is recorded on its delivery (the bus's rule) and the event still counts as
 *           received; a claim whose transaction rolls back is released. Every receipt runs inside `withScope`, the
 *           event's scope or none, so a scope never leaks into the next receipt of the same transaction. `drain` runs
 *           everything the bus has queued, as @stackra/events' bus does. Relays (listeners taking an `EventEnvelope`,
 *           resolved by `connect`) get every claimed envelope, a wire name with no class included, so a service with
 *           a relay claims an unknown event for its relay instead of refusing it. A relay that throws rolls the receipt
 *           back (the claim is released and the event is redelivered), so a relay should be a queued listener.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 2 to 4: the inbox deduplicates on the event id); ADR 0141 (decisions 2 and 3);
 *                     ADR 0260 (decision 4: the relay);
 *                     ADR 0327 (decision 9: the scope session).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import type { EventBus, EventClass, Listener, ListenerContext } from "@stackra/events";

import type { EventEnvelope, InboxDriver } from "#contracts/index";
import { EVENT_NAMES } from "#core/constants/event-names.constant";
import { RELAYS } from "#core/constants/relays.constant";
import { UnknownEventError } from "#core/errors/unknown-event.error";

/**
 * Receives integration events once each.
 *
 * @example
 * // in a consuming service's generated subscription handler
 * await inbox.receive(envelope);
 */
export class InboxService extends Service {
  /** Where received ids are kept. */
  private readonly driver: InboxDriver;

  /** The bus the listeners are subscribed on. */
  private readonly bus: EventBus;

  /** Opens the transaction and scope of each receipt. */
  private readonly database: Database;

  /** Reads when an id is received. */
  private readonly clock: Clock;

  /** The relays `connect` resolved, in registration order. */
  private readonly relays: Listener[] = [];

  /**
   * @param driver - the store of received ids.
   * @param bus - the in-process bus that runs the listeners.
   * @param database - the connected database each receipt runs a transaction of.
   * @param clock - the time an id is received at.
   */
  constructor(driver: InboxDriver, bus: EventBus, database: Database, clock: Clock) {
    super();
    this.driver = driver;
    this.bus = bus;
    this.database = database;
    this.clock = clock;
  }

  /**
   * Resolves every registered relay that `container` binds; connecting again adds none twice.
   *
   * @param container - a container or a testing app; relays of modules it did not boot are skipped.
   */
  connect(container: {
    has(type: AnyClass): boolean;
    get<T extends object>(type: AnyClass<T>): T;
  }): void {
    for (const type of RELAYS)
      if (container.has(type)) {
        const relay = container.get(type);
        if (!this.relays.includes(relay)) this.relays.push(relay);
      }
  }

  /**
   * Runs the listeners of the event in `envelope`, and hands the envelope to each relay, unless its id was received
   * before.
   *
   * @returns `true` when this call ran it, `false` when it had been received.
   * @throws UnknownEventError when its wire name names no integration event of this process and no relay is connected.
   * @throws ZodError when its data breaks the event's schema.
   */
  async receive(envelope: EventEnvelope): Promise<boolean> {
    const type = EVENT_NAMES.byName.get(envelope.type) as EventClass | undefined;
    if (type === undefined && this.relays.length === 0)
      throw UnknownEventError.create({ type: envelope.type });
    const event = type?.create(envelope.data as never);
    const meta = { ...envelope.meta, id: envelope.id, occurredAt: new Date(envelope.occurredAt) };
    return this.database.withScope(envelope.scope ?? [], async () => {
      if (!(await this.driver.claim(envelope.id, this.clock.now()))) return false;
      const { id, ...rest } = meta;
      const context: ListenerContext = { ...rest, eventId: id, now: () => this.clock.now() };
      for (const relay of this.relays) await relay.handle(envelope as never, context);
      if (event !== undefined) {
        this.bus.deliver(event, meta);
        await this.bus.drain();
      }
      return true;
    });
  }

  /** Forgets the ids received before `before`; the retention purge a scheduled job runs. */
  prune(before: Date): Promise<void> {
    return this.driver.prune(before);
  }
}
