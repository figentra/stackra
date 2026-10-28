/**
 * Stackra file contract:
 * Purpose: `OutboxRelayService`, the relay: on every tick one relay of the service, holding a lock, takes the due
 *          messages oldest first and delivers each: an event through the `EventPublisher` (a row change message left
 *          from before the change log to every change consumer of its model, in the row's scope). A delivered message
 *          is deleted; a failed one is retried after an exponential backoff and dead-lettered (and logged) after its
 *          last attempt. With a batch window (`outbox.batchWindowSeconds`), a tick holds a part batch until its oldest
 *          message has been due that long. Then, for each change consumer the container binds, it reads the retained
 *          change log after that consumer's cursor and hands it each run of one model's changes in one scope
 *          (`consumeMany` with the run coalesced, or `consume` one by one), saving the cursor after the run; a failed
 *          consumer retries from its cursor after the same backoff and stalls (logged, nothing dropped) after its last
 *          attempt, while every other consumer moves on.
 * Boundary: a platform service over the `OutboxDriver` and `EventPublisher` ports, @stackra/locking's `Locks`, the
 *           `Database` and the `Clock`; `connect(container)` gives it the container its change consumers and logger are
 *           resolved from (the runtime and a test call it, as they call `EventBus.connect`). Delivery is at least once:
 *           a relay that dies after publishing and before recording publishes again, so every consumer is idempotent
 *           (the inbox deduplicates events by id), and a consumer's cursor is saved after its runs, so a run is
 *           delivered again after a failure. With the Postgres lock driver a tick runs in one transaction, so
 *           each consumer runs in its own `withScope` (a savepoint), its scope or none, and a scope never leaks into
 *           the next delivery. A consumer class the container does not bind is skipped, as unbooted listeners are.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4: the relay); ADR 0221 (decision 5: under five seconds of lag); ADR 0142
 *                     (decision 1); ADR 0149 (one runner under a lock); ADR 0327 (decision 9: the scope session);
 *                     OS-289 (the audit read trail's five-second batch); ADR 0078 and ADR 0221 (2026-10-28 amendment:
 *                     per-consumer cursors on the retained change log); data-layer gap se3 (batches and coalescing).
 */
import type { Resolver } from "@stackra/actions";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { backoffDelay, Duration, Logger } from "@stackra/contracts";
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import type { Locks } from "@stackra/locking";
import { JOB_BACKOFF } from "@stackra/queue";

import type { OutboxConfig } from "#config/outbox.config";
import { MessageKind } from "#contracts/index";
import type {
  ChangeConsumer,
  ChangeCursor,
  ChangeFeed,
  ChangeRecord,
  EventEnvelope,
  EventPublisher,
  OutboxDriver,
  OutboxError,
  OutboxMessage,
  RowChange,
} from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";
import { coalesceChanges } from "#core/functions/coalesce-changes.function";
import { OUTBOX_DEFAULTS } from "#core/constants/outbox-defaults.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";

/** A run of one model's changes in one scope, consecutive in the log. */
interface Run {
  readonly scope: ScopeRef | undefined;
  readonly changes: RowChange[];
  position: string;
}

/** The consecutive runs of `records` that share a model and a scope. */
function runsOf(records: readonly ChangeRecord[]): readonly Run[] {
  const runs: Run[] = [];
  for (const record of records) {
    const last = runs.at(-1);
    if (
      last !== undefined &&
      last.changes[0]?.model === record.change.model &&
      last.scope?.id === record.scope?.id &&
      last.scope?.path === record.scope?.path
    ) {
      last.changes.push(record.change);
      last.position = record.position;
    } else runs.push({ scope: record.scope, changes: [record.change], position: record.position });
  }
  return runs;
}

/** Every registered change consumer class with the model names it watches. */
function consumersOf(): ReadonlyMap<AnyClass<ChangeConsumer>, readonly string[]> {
  const consumers = new Map<AnyClass<ChangeConsumer>, string[]>();
  for (const [model, watch] of CHANGE_CONSUMERS)
    for (const type of watch.consumers)
      consumers.set(type, [...(consumers.get(type) ?? []), model]);
  return consumers;
}

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

  /** The retained change log and its cursors. */
  private readonly feed: ChangeFeed;

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
   * @param feed - the change log the change consumers read.
   * @param publisher - the transport of integration events.
   * @param locks - the locks one tick holds.
   * @param database - the connected database each change delivery runs a scope of.
   * @param clock - the time source of ticks and retries.
   * @param config - the batch window.
   */
  constructor(
    driver: OutboxDriver,
    feed: ChangeFeed,
    publisher: EventPublisher,
    locks: Locks,
    database: Database,
    clock: Clock,
    config: OutboxConfig,
  ) {
    super();
    this.driver = driver;
    this.feed = feed;
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
   * retried or dead (inside the batch window a part batch is held for a later tick), then up to a batch of changes to
   * each bound change consumer from its cursor.
   *
   * @returns how many messages and changes the tick handled; `0` when none was due, the batch was held or another
   *          relay held the lock.
   * @throws Error before `connect`; a store's or the lock's error.
   */
  async relay(): Promise<number> {
    const resolver = this.connected();
    let handled = 0;
    await this.locks.tryWith(OUTBOX_DEFAULTS.lockKey, OUTBOX_DEFAULTS.lockTtl, async () => {
      const now = this.clock.now();
      const due = await this.driver.due(now, OUTBOX_DEFAULTS.batchSize);
      if (!this.holds(due, now))
        for (const message of due) {
          // oxlint-disable-next-line no-await-in-loop -- in order, each recorded before the next is delivered
          await this.deliver(message, now, resolver);
          handled += 1;
        }
      for (const [type, models] of consumersOf())
        if (resolver.has(type))
          handled += await this.deliverChanges(type, models, now, resolver.get(type));
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
      } catch (error) {
        this.logger()?.error(OUTBOX_LOG_EVENTS.relayFailed, { cause: error });
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
          now.getTime() +
            backoffDelay({ ...JOB_BACKOFF, backoff: OUTBOX_DEFAULTS.backoff }, attempt),
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

  /**
   * Hands `consumer` the changes of `models` after its cursor, run by run, and saves how far it got; a failure keeps the
   * runs that succeeded, backs off, and stalls the cursor after the last attempt.
   *
   * @returns how many changes it handled.
   */
  private async deliverChanges(
    type: AnyClass<ChangeConsumer>,
    models: readonly string[],
    now: Date,
    consumer: ChangeConsumer,
  ): Promise<number> {
    const cursor: ChangeCursor = (await this.feed.cursor(type.name)) ?? {
      consumer: type.name,
      attempts: 0,
      availableAt: now,
    };
    if (cursor.stalledAt !== undefined || cursor.availableAt.getTime() > now.getTime()) return 0;
    const records = await this.feed.read(cursor.position, models, OUTBOX_DEFAULTS.batchSize);
    if (records.length === 0) return 0;
    let position = cursor.position;
    let handled = 0;
    try {
      for (const run of runsOf(records)) {
        await this.database.withScope(run.scope ?? [], async () => {
          if (consumer.consumeMany !== undefined)
            await consumer.consumeMany(coalesceChanges(run.changes));
          else for (const change of run.changes) await consumer.consume(change);
        });
        position = run.position;
        handled += run.changes.length;
      }
    } catch (error) {
      await this.feed.save(this.failedCursor(cursor, position, error, now));
      return handled;
    }
    await this.feed.save({
      consumer: type.name,
      ...(position === undefined ? {} : { position }),
      attempts: 0,
      availableAt: now,
    });
    return handled;
  }

  /** The cursor after a failed run: kept progress, one more attempt, its retry time or, at the last, its stall. */
  private failedCursor(
    cursor: ChangeCursor,
    position: string | undefined,
    error: unknown,
    now: Date,
  ): ChangeCursor {
    const failure = this.failureOf(error);
    // A run that got further starts its attempts again: only a change that keeps failing stalls the cursor.
    const attempts = position === cursor.position ? cursor.attempts + 1 : 1;
    const base = {
      consumer: cursor.consumer,
      ...(position === undefined ? {} : { position }),
      attempts,
      lastError: failure,
    };
    if (attempts < OUTBOX_DEFAULTS.attempts)
      return {
        ...base,
        availableAt: new Date(
          now.getTime() +
            backoffDelay({ ...JOB_BACKOFF, backoff: OUTBOX_DEFAULTS.backoff }, attempts),
        ),
      };
    this.logger()?.error(OUTBOX_LOG_EVENTS.consumerStalled, {
      consumer: cursor.consumer,
      attempts,
      code: failure.code,
    });
    return { ...base, availableAt: now, stalledAt: now };
  }

  /** Hands a stored row change message to each consumer of its model the container binds, in the row's scope. */
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
