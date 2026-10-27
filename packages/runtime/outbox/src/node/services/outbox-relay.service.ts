/**
 * Stackra file contract:
 * Purpose: `OutboxRelayService`, the relay: on every tick one relay of the service, holding a lock, takes the due
 *          messages oldest first and delivers each: an event through the `EventPublisher`, a row change to every
 *          change consumer registered for its model, in the row's scope. A delivered message is deleted; a failed one
 *          is retried after an exponential backoff and dead-lettered (and logged) after its last attempt. With a batch
 *          window (`outbox.batchWindowSeconds`), a tick holds a part batch until its oldest message has been due that
 *          long, so a service that sends in batches gets fewer, fuller ticks.
 * Boundary: a platform service over the `OutboxDriver` and `EventPublisher` ports, @stackra/locking's `Locks`, the
 *           `Database` and the `Clock`; `connect(container)` gives it the container its change consumers and logger are
 *           resolved from (the runtime and a test call it, as they call `EventBus.connect`). Delivery is at least once:
 *           a relay that dies after publishing and before recording publishes again, so every consumer is idempotent
 *           (the inbox deduplicates events by id). With the Postgres lock driver a tick runs in one transaction, so
 *           each consumer runs in its own `withScope` (a savepoint), its scope or none, and a scope never leaks into
 *           the next delivery. A consumer class the container does not bind is skipped, as unbooted listeners are.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4: the relay); ADR 0221 (decision 5: under five seconds of lag); ADR 0142
 *                     (decision 1); ADR 0149 (one runner under a lock); ADR 0327 (decision 9: the scope session);
 *                     OS-289 (the audit read trail's five-second batch).
 */
import type { Resolver } from "@stackra/actions";
import { Service } from "@stackra/container";
import { Duration, Logger } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import type { Locks } from "@stackra/locking";
import { backoffDelay } from "@stackra/queue";

import type { OutboxConfig } from "#config/outbox.config";
import { MessageKind } from "#contracts/index";
import type {
  EventEnvelope,
  EventPublisher,
  OutboxDriver,
  OutboxError,
  OutboxMessage,
  RowChange,
} from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";
import { OUTBOX_DEFAULTS } from "#core/constants/outbox-defaults.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";

/**
 * Relays outbox messages.
 *
 * @example
 * relay.connect(container);
 * await relay.work({ signal: shutdown.signal });
 */
export class OutboxRelayService extends Service {
  /** Where messages are stored. */
  private readonly driver: OutboxDriver;

  /** The transport events are published through. */
  private readonly publisher: EventPublisher;

  /** Keeps one relay per service running a tick. */
  private readonly locks: Locks;

  /** Opens the scope of each change delivery. */
  private readonly database: Database;

  /** Reads "now" for a tick and a retry. */
  private readonly clock: Clock;

  /** The batch window. */
  private readonly config: OutboxConfig;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param driver - the message store.
   * @param publisher - the transport of integration events.
   * @param locks - the locks one tick holds.
   * @param database - the connected database each change delivery runs a scope of.
   * @param clock - the time source of ticks and retries.
   * @param config - the batch window.
   */
  constructor(
    driver: OutboxDriver,
    publisher: EventPublisher,
    locks: Locks,
    database: Database,
    clock: Clock,
    config: OutboxConfig,
  ) {
    super();
    this.driver = driver;
    this.publisher = publisher;
    this.locks = locks;
    this.database = database;
    this.clock = clock;
    this.config = config;
  }

  /** Resolves change consumers and the logger from `resolver` (a booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * One tick: when no other relay holds the lock, delivers up to a batch of due messages, each recorded as delivered,
   * retried or dead. Inside the batch window a part batch is held for a later tick.
   *
   * @returns how many messages the tick handled; `0` when none was due, the batch was held or another relay held the
   *          lock.
   * @throws Error before `connect`; a store's or the lock's error.
   */
  async relay(): Promise<number> {
    const resolver = this.connected();
    let handled = 0;
    await this.locks.tryWith(OUTBOX_DEFAULTS.lockKey, OUTBOX_DEFAULTS.lockTtl, async () => {
      const now = this.clock.now();
      const due = await this.driver.due(now, OUTBOX_DEFAULTS.batchSize);
      if (this.holds(due, now)) return;
      for (const message of due) {
        // oxlint-disable-next-line no-await-in-loop -- in order, each recorded before the next is delivered
        await this.deliver(message, now, resolver);
        handled += 1;
      }
    });
    return handled;
  }

  /**
   * Ticks until `signal` aborts, pausing a second after a tick that handled nothing; a tick that fails is logged and
   * paused after the same way.
   *
   * @throws Error before `connect`.
   */
  async work(options: { readonly signal: AbortSignal }): Promise<void> {
    this.connected();
    while (!options.signal.aborted) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- one tick at a time
        if ((await this.relay()) === 0) await this.pause(options.signal);
      } catch (cause) {
        this.logger()?.error(OUTBOX_LOG_EVENTS.relayFailed, { cause });
        // oxlint-disable-next-line no-await-in-loop -- see above
        await this.pause(options.signal);
      }
    }
  }

  /** Whether a part batch waits: the oldest of `due` became due less than the batch window before `now`. */
  private holds(due: readonly OutboxMessage[], now: Date): boolean {
    const window = this.config.batchWindowSeconds * 1000;
    if (window === 0 || due.length === 0 || due.length >= OUTBOX_DEFAULTS.batchSize) return false;
    const oldest = Math.min(...due.map((message) => message.availableAt.getTime()));
    return now.getTime() - oldest < window;
  }

  /** Delivers one message and records how it went. */
  private async deliver(message: OutboxMessage, now: Date, resolver: Resolver): Promise<void> {
    try {
      await (message.kind === MessageKind.Event
        ? this.publisher.publish(this.envelopeOf(message))
        : this.consume(message, resolver));
      await this.driver.remove(message.id);
    } catch (error) {
      const failure = this.failureOf(error);
      const attempt = message.attempts + 1;
      if (attempt < OUTBOX_DEFAULTS.attempts) {
        const availableAt = new Date(
          now.getTime() + backoffDelay(OUTBOX_DEFAULTS.backoff, attempt),
        );
        await this.driver.retry(message.id, availableAt, failure);
        return;
      }
      await this.driver.deadLetter(message.id, failure, now);
      this.logger()?.error(OUTBOX_LOG_EVENTS.messageDead, {
        messageId: message.id,
        type: message.type,
        attempts: attempt,
        code: failure.code,
      });
    }
  }

  /** Hands a row change to each consumer of its model the container binds, in the row's scope. */
  private async consume(message: OutboxMessage, resolver: Resolver): Promise<void> {
    const change = message.data as RowChange;
    for (const type of CHANGE_CONSUMERS.get(change.model)?.consumers ?? []) {
      if (!resolver.has(type)) continue;
      const consumer = resolver.get(type);
      // oxlint-disable-next-line no-await-in-loop -- consumers run in registration order
      await this.database.withScope(message.scope ?? [], () => consumer.consume(change));
    }
  }

  /** The wire form of an event message. */
  private envelopeOf(message: OutboxMessage): EventEnvelope {
    return Object.freeze({
      id: message.id,
      type: message.type,
      occurredAt: message.occurredAt.toISOString(),
      ...(message.scope === undefined ? {} : { scope: message.scope }),
      meta: message.meta,
      data: message.data,
    });
  }

  /** What a stored message keeps of `error`. */
  private failureOf(error: unknown): OutboxError {
    return {
      code: isRefusal(error) ? error.code : "internal",
      message: error instanceof Error ? error.message : String(error),
    };
  }

  /** Resolves after the poll interval, or at once when `signal` aborts. */
  private pause(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const done = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, Duration.toMilliseconds(OUTBOX_DEFAULTS.pollInterval));
      signal.addEventListener("abort", done, { once: true });
    });
  }

  /** The bound logger, when there is one. */
  private logger(): Logger | undefined {
    const resolver = this.resolver;
    return resolver?.has(Logger) === true ? resolver.get(Logger) : undefined;
  }

  /**
   * The connected resolver.
   *
   * @throws Error before `connect`.
   */
  private connected(): Resolver {
    if (this.resolver === undefined)
      throw new Error("OutboxRelayService is not connected: call relay.connect(container) first");
    return this.resolver;
  }
}
