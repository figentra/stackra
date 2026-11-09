/**
 * Stackra file contract:
 * Purpose: `OutboxRelayService`, the relay: on every tick one relay of the service, holding a lock, claims the due
 *          messages of every tenant oldest first, loads each in its tenant's isolation and delivers it: an event through
 *          the `EventPublisher` (a row change message left
 *          from before the change log to every change consumer of its model, in the row's scope). A delivered message
 *          is deleted; a failed one is retried after an exponential backoff and dead-lettered (and logged) after its
 *          last attempt. With a batch window (`outbox.batchWindowSeconds`), a tick holds a part batch until its oldest
 *          message has been due that long. Then, for each change consumer the container binds, it reads the retained
 *          change log after that consumer's cursor (claimed across tenants, each tenant's entries loaded in its own
 *          isolation) and hands it each run of one model's changes in one scope
 *          (`consumeMany` with the run coalesced, or `consume` one by one), saving the cursor after the run; a failed
 *          consumer retries from its cursor after the same backoff and stalls (logged, nothing dropped) after its last
 *          attempt, while every other consumer moves on. An event is published at its current version and then at
 *          each older version a live `Change` still serves (ADR 0141, stackra-403), all under the same id; when the
 *          container binds `CrossAppFanOut`, each of those versions is then written as a delivery to every subscriber
 *          in another app that takes it (ADR 0511 decision 12), and a failure there fails the message.
 * Boundary: a platform service over the `OutboxDriver` and `EventPublisher` ports, @stackra/locking's `Locks`, the
 *           `Database` and the `Clock`; `connect(container)` gives it the container its change consumers and logger are
 *           resolved from (the runtime and a test call it, as they call `EventBus.connect`). Delivery is at least once:
 *           a relay that dies after publishing and before recording publishes again, so every consumer is idempotent
 *           (the inbox deduplicates events by id), and a consumer's cursor is saved after its runs, so a run is
 *           delivered again after a failure. With the Postgres lock driver a tick runs in one transaction, so
 *           each consumer runs in its own isolation (a savepoint), its scope or none, and a scope never leaks into
 *           the next delivery. With a `CallIsolation` bound (ADR 0495) that isolation is the stored actor's (a message
 *           stored with no actor runs as a platform call, which matches no tenant row) in the stored scope, and a
 *           run of changes splits where the actor changes; with none bound it is `Database.withScope` alone. A consumer class the container does not bind is skipped, as unbooted listeners are.
 *           The tables are tenant-owned (ADR 0239 amendment, gaps A and C): a claim hands back ids and tenants only, and
 *           a message's load, fan-out and outcome run in its tenant's isolation (`inRowOwner`), the fan-out with the
 *           delivery's outcome so the deliveries take the message's tenant. A claimed row that does not load, or a
 *           tenant's row with no isolation bound, fails the tick (`ClaimNotLoadedError`, `RowIsolationMissingError`):
 *           it is never skipped.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4: the relay); ADR 0221 (decision 5: under five seconds of lag); ADR 0142
 *                     (decision 1); ADR 0149 (one runner under a lock); ADR 0327 (decision 9: the scope session);
 *                     OS-289 (the audit read trail's five-second batch); ADR 0078 and ADR 0221 (2026-10-28 amendment:
 *                     per-consumer cursors on the retained change log); data-layer gap se3 (batches and coalescing).
 */
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, backoffDelay, Logger } from "@stackra/contracts";
import type { Actor, Clock, ScopeRef } from "@stackra/contracts";
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
  OutboxClaim,
  OutboxDriver,
  OutboxError,
  OutboxMessage,
  RowChange,
} from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { coalesceChanges } from "#core/functions/coalesce-changes.function";
import { inRowOwner } from "#core/functions/in-row-owner.function";
import { loadChanges } from "#core/functions/load-changes.function";
import { olderEnvelopes } from "#core/functions/older-envelopes.function";
import { pauseFor } from "#core/functions/pause-for.function";
import { OUTBOX_DEFAULTS } from "#core/constants/outbox-defaults.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";
import { CrossAppFanOut } from "#node/services/cross-app-fan-out.service";

/** A run of one model's changes in one scope by one actor, consecutive in the log. */
interface Run {
  readonly scope: ScopeRef | undefined;
  readonly actor: Actor;
  readonly changes: RowChange[];
  position: string;
}

/** The platform actor of a message or change stored with no actor: no scope, so it matches no tenant row. */
const PLATFORM_ACTOR: Actor = Object.freeze({ kind: ActorKind.System, id: "sys_outbox_relay" });

/** The actor a stored message or change runs as: the one stored with it, else the platform actor. */
function actorOf(meta: OutboxMessage["meta"]): Actor {
  return meta.actor ?? PLATFORM_ACTOR;
}

/** Whether two actors would set the same isolation: the same principal in the same tenant. */
function sameActor(a: Actor, b: Actor): boolean {
  return a.id === b.id && a.scopeId === b.scopeId;
}

/** The consecutive runs of `records` that share a model, a scope and an actor. */
function runsOf(records: readonly ChangeRecord[]): readonly Run[] {
  const runs: Run[] = [];
  for (const record of records) {
    const last = runs.at(-1);
    if (
      last !== undefined &&
      last.changes[0]?.model === record.change.model &&
      last.scope?.id === record.scope?.id &&
      last.scope?.path === record.scope?.path &&
      sameActor(last.actor, actorOf(record.meta))
    ) {
      last.changes.push(record.change);
      last.position = record.position;
    } else
      runs.push({
        scope: record.scope,
        actor: actorOf(record.meta),
        changes: [record.change],
        position: record.position,
      });
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
      const due = await this.driver.claim(now, OUTBOX_DEFAULTS.batchSize);
      if (!this.holds(due, now))
        for (const claim of due) {
          await this.deliver(claim, now, resolver);
          handled += 1;
        }
      for (const [type, models] of consumersOf())
        if (resolver.has(type)) handled += await this.deliverChanges(type, models, now, resolver);
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
        if ((await this.relay()) === 0) await this.pause(options.signal);
      } catch (error) {
        this.logger()?.error(OUTBOX_LOG_EVENTS.relayFailed, { cause: error });
        await this.pause(options.signal);
      }
    }
  }

  /** Whether a part batch waits: the oldest of `due` became due less than the batch window before `now`. */
  private holds(due: readonly OutboxClaim[], now: Date): boolean {
    const window = this.config.batchWindowSeconds * 1000;
    if (window === 0 || due.length === 0 || due.length >= OUTBOX_DEFAULTS.batchSize) return false;
    const oldest = Math.min(...due.map((message) => message.availableAt.getTime()));
    return now.getTime() - oldest < window;
  }

  /**
   * Loads one claimed message in its tenant, delivers it and records how it went there.
   *
   * @throws ClaimNotLoadedError when the claimed message does not load in its tenant.
   * @throws RowIsolationMissingError when it has a tenant and no `CallIsolation` is bound.
   */
  private async deliver(claim: OutboxClaim, now: Date, resolver: Resolver): Promise<void> {
    const isolation = resolver.has(CallIsolation) ? resolver.get(CallIsolation) : undefined;
    const inOwner = <T>(work: () => Promise<T>) =>
      inRowOwner(isolation, claim.ownerId, claim.id, work);
    const message = await inOwner(() => this.driver.load(claim.id));
    if (message === undefined) throw ClaimNotLoadedError.create({ id: claim.id });
    try {
      if (message.kind === MessageKind.Event) {
        const envelopes = await this.publish(this.envelopeOf(message), now);
        await inOwner(async () => {
          await this.fanOut(envelopes, now);
          await this.driver.remove(message.id);
        });
      } else {
        await this.consume(message, resolver);
        await inOwner(() => this.driver.remove(message.id));
      }
    } catch (error) {
      const failure = this.failureOf(error);
      const attempt = message.attempts + 1;
      if (attempt < OUTBOX_DEFAULTS.attempts) {
        const availableAt = new Date(
          now.getTime() +
            backoffDelay({ ...JOB_BACKOFF, backoff: OUTBOX_DEFAULTS.backoff }, attempt),
        );
        await inOwner(() => this.driver.retry(message.id, availableAt, failure));
        return;
      }
      await inOwner(() => this.driver.deadLetter(message.id, failure, now));
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
    resolver: Resolver,
  ): Promise<number> {
    const consumer = resolver.get(type);
    const cursor: ChangeCursor = (await this.feed.cursor(type.name)) ?? {
      consumer: type.name,
      attempts: 0,
      availableAt: now,
    };
    if (cursor.stalledAt !== undefined || cursor.availableAt.getTime() > now.getTime()) return 0;
    const claims = await this.feed.claim(cursor.position, models, OUTBOX_DEFAULTS.batchSize);
    if (claims.length === 0) return 0;
    const records = await loadChanges(
      this.feed,
      resolver.has(CallIsolation) ? resolver.get(CallIsolation) : undefined,
      claims,
    );
    let position = cursor.position;
    let handled = 0;
    try {
      for (const run of runsOf(records)) {
        await this.isolated(resolver, run.actor, run.scope, async () => {
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
      await this.isolated(resolver, actorOf(message.meta), message.scope, () =>
        consumer.consume(change),
      );
    }
  }

  /**
   * Runs `work` through the bound `CallIsolation` as the stored actor in the stored scope (ADR 0495), in a transaction
   * of its own (`requiresNew`), so a tick's transaction never carries one actor's tenant into the next delivery and the
   * isolation can refuse a switch; else in the scope session alone, as before.
   */
  private isolated<T>(
    resolver: Resolver,
    actor: Actor,
    scope: ScopeRef | undefined,
    work: () => Promise<T>,
  ): Promise<T> {
    return resolver.has(CallIsolation)
      ? this.database.transaction(
          () => resolver.get(CallIsolation).run(actor, scope, work, { readOnly: false }),
          { requiresNew: true },
        )
      : this.database.withScope(scope ?? [], work);
  }

  /**
   * Publishes `envelope`, then each older version still published on `now` under the same id (ADR 0141).
   *
   * @returns every envelope it published.
   */
  private async publish(envelope: EventEnvelope, now: Date): Promise<readonly EventEnvelope[]> {
    const envelopes = [envelope, ...olderEnvelopes(envelope, now)];
    for (const each of envelopes) await this.publisher.publish(each);
    return envelopes;
  }

  /**
   * When the container binds the cross-app fan-out, writes the deliveries of `envelopes` to other apps (ADR 0511
   * decision 12), in the running isolation, so each takes the message's tenant.
   */
  private async fanOut(envelopes: readonly EventEnvelope[], now: Date): Promise<void> {
    if (this.resolver?.has(CrossAppFanOut) === true)
      await this.resolver.get(CrossAppFanOut).fanOut(envelopes, now);
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
    return pauseFor(signal, OUTBOX_DEFAULTS.pollInterval);
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
