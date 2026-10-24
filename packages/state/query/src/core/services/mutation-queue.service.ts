/**
 * Stackra file contract:
 * Purpose: `MutationQueue`, the offline mutation queue of a client: it holds the calls the offline map lets it queue,
 *          each with the Idempotency-Key minted when it was queued, persists them in the `outbox` area, replays them
 *          per aggregate first in first out (up to `maxParallelAggregates` aggregates at once) when this context leads
 *          and the network is up, and turns a refusal for good or an expired call into a conflict record a person
 *          resolves (`useMutationQueue()` reads it).
 * Boundary: a singleton service; the host's query context calls `open(partition)` after sign-in and on every switch,
 *           so a call is only ever replayed for the principal and scope that queued it. A conflict blocks the later
 *           calls of its aggregate until it is resolved or discarded, and nothing is overwritten silently (ADR 0059
 *           decision 3). A failed send that may succeed later keeps the entry; a call that fails to persist is not
 *           queued. No sync engine: replay is the action call with its key (ADR 0227 row).
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decisions 2 and 3); ADR 0252 (decision 2: retention, a leader, per-aggregate order);
 *                     ADR 0138 (the idempotency step); ADR 0294 (decisions 16 and 17).
 */
import { ConflictResolution, OfflineMode } from "@stackra/actions";
import { Service } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { Platform } from "@stackra/platform/contracts";
import { StorageArea } from "@stackra/storage";
import { duration } from "@stackra/validation";

import { QueryConfig } from "#config/query.config";
import { MutationSender } from "#contracts/ports/mutation-sender.port";
import { QueryPersister } from "#contracts/ports/query-persister.port";
import { QueueLeader } from "#contracts/ports/queue-leader.port";
import type { ReplayOutcome } from "#contracts/types/replay-outcome.type";
import { OFFLINE_POLICIES } from "#core/constants/offline-policies.constant";
import { PERSISTED_QUEUE_SCHEMA } from "#core/constants/persisted-queue-schema.constant";
import { OfflineError } from "#core/errors/offline.error";
import { partitionKey } from "#core/functions/partition-key.function";
import type { ConflictRecord } from "#core/types/conflict-record.type";
import type { OfflineActionRef } from "#core/types/offline-action-ref.type";
import type { PendingMutation } from "#core/types/pending-mutation.type";
import type { QueryPartition } from "#core/types/query-partition.type";

/** The aggregate of a call queued without one: such calls share one lane, so their order holds. */
const DEFAULT_AGGREGATE = "default";

/** The conflict code of a call that outlived its retention. */
const STALE_CODE = "stale_offline_mutation";

/** A send that did not reach the server, or a throw: the entry waits. */
const NOT_REACHED: ReplayOutcome = Object.freeze({ ok: false, code: null, server: null });

/** What the queue holds; replaced, never mutated, on each change. */
interface QueueState {
  readonly items: readonly PendingMutation[];
  readonly conflicts: readonly ConflictRecord[];
  readonly isDraining: boolean;
}

/** A queue with nothing in it. */
const EMPTY: QueueState = Object.freeze({ items: [], conflicts: [], isDraining: false });

/**
 * The offline mutation queue.
 *
 * @example
 * await queue.open({ principal: session.user.userId, scope: activeScope });
 * await queue.enqueue(CreateOrderAction, input, input.orderId); // offline
 * queue.pending; // 1, until the network returns and the leader drains it
 */
export class MutationQueue extends Service {
  private readonly config: QueryConfig;

  private readonly persister: QueryPersister;

  private readonly sender: MutationSender;

  private readonly leader: QueueLeader;

  private readonly platform: Platform;

  private readonly clock: Clock;

  private readonly listeners = new Set<() => void>();

  private readonly stops: readonly (() => void)[];

  private state: QueueState = EMPTY;

  private changes = 0;

  private draining: Promise<void> | undefined;

  private rerun = false;

  private saving: Promise<void> = Promise.resolve();

  private opens = 0;

  /** The outbox key of the open partition; `undefined` until `open` resolves, and while a switch reads the next one. */
  private partition: string | undefined;

  /**
   * @param config - scope, replay, parallelism and retention.
   * @param persister - keeps the queue in the `outbox` area.
   * @param sender - sends one call with its Idempotency-Key.
   * @param leader - whether this context drains.
   * @param platform - the network signal.
   * @param clock - stamps and expires entries.
   */
  constructor(
    config: QueryConfig,
    persister: QueryPersister,
    sender: MutationSender,
    leader: QueueLeader,
    platform: Platform,
    clock: Clock,
  ) {
    super();
    this.config = config;
    this.persister = persister;
    this.sender = sender;
    this.leader = leader;
    this.platform = platform;
    this.clock = clock;
    const replayWhenOn = (isOn: boolean): void => {
      if (isOn) this.replayIfAllowed();
    };
    this.stops = [
      platform.network.isOnline.subscribe(replayWhenOn),
      leader.isLeader.subscribe(replayWhenOn),
    ];
  }

  /** The calls waiting for the network, first in first out within each aggregate. */
  get items(): readonly PendingMutation[] {
    return this.state.items;
  }

  /** The calls that need a person: refused for good, or older than their retention. */
  get conflicts(): readonly ConflictRecord[] {
    return this.state.conflicts;
  }

  /** How many calls wait. */
  get pending(): number {
    return this.state.items.length;
  }

  /** True while this context is replaying. */
  get isDraining(): boolean {
    return this.state.isDraining;
  }

  /**
   * Calls `listener` after every change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** A number that changes with every change of the queue; the snapshot `useMutationQueue` reads. */
  readonly version = (): number => this.changes;

  /**
   * Opens the queue of `partition`: reads what it persisted, then replays it when allowed. Until it resolves the queue
   * is closed, so nothing is queued or replayed against the wrong principal or scope.
   *
   * @throws TypeError when what is stored is not a queue this version can read; it is left untouched.
   * @throws Error the persister's read error; the queue stays closed.
   */
  async open(partition: QueryPartition): Promise<void> {
    const key = `query.queue.${partitionKey(this.config.scope, partition)}`;
    const ticket = ++this.opens;
    this.partition = undefined;
    this.publish(EMPTY);
    const stored = await this.persister.read(StorageArea.Outbox, key);
    if (ticket !== this.opens) return;
    const parsed = PERSISTED_QUEUE_SCHEMA.safeParse(
      stored ?? { version: 1, items: [], conflicts: [] },
    );
    if (!parsed.success)
      throw new TypeError(`The stored offline queue under ${key} cannot be read; it was kept`);
    this.seed(key, parsed.data.items, parsed.data.conflicts);
    this.replayIfAllowed();
  }

  /**
   * Queues a call to `action` with `input`, ordered after the earlier calls of `aggregate`, and resolves once it is
   * persisted. Its expiry is the action's declared retention, at most `queueRetentionDays`.
   *
   * @param aggregate - the record the call changes (its public id); calls without one share a lane.
   * @throws OfflineError when the offline map does not let the queue hold `action`.
   * @throws TypeError when the queue is not open.
   * @throws Error the persister's write error; the call is not queued.
   */
  async enqueue(
    action: OfflineActionRef | string,
    input: Json,
    aggregate: string = DEFAULT_AGGREGATE,
  ): Promise<PendingMutation> {
    const key = typeof action === "string" ? action : action.key;
    const policy = OFFLINE_POLICIES.get(key);
    if (policy?.mode !== OfflineMode.Queue) throw OfflineError.create({ action: key });
    const partition = this.opened();
    const now = this.clock.now();
    const retention = Math.min(
      Duration.toMilliseconds(duration(policy.retention)),
      Duration.toMilliseconds(Duration.days(this.config.queueRetentionDays)),
    );
    const entry: PendingMutation = Object.freeze({
      id: globalThis.crypto.randomUUID(),
      action: key,
      input,
      aggregate,
      queuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + retention).toISOString(),
    });
    this.publish({ ...this.state, items: [...this.state.items, entry] });
    try {
      await this.persist(partition);
    } catch (error) {
      // Not durable means not queued: the caller is told, and no replay sends it behind their back.
      if (this.partition === partition)
        this.publish({ ...this.state, items: this.state.items.filter((item) => item !== entry) });
      throw error;
    }
    this.replayIfAllowed();
    return entry;
  }

  /**
   * Replays the waiting calls now when this context leads and the network is up; resolves when the replay settles. A
   * call during a replay joins it, and the replay runs once more for what was added.
   */
  drain(): Promise<void> {
    if (this.draining !== undefined) {
      this.rerun = true;
      return this.draining;
    }
    this.draining = this.run().finally(() => {
      this.draining = undefined;
    });
    return this.draining;
  }

  /**
   * Applies a person's resolution to the conflict `id`: `server_wins` drops the local intent, `client_retry` queues it
   * again ahead of its aggregate with a new Idempotency-Key (the old key would replay the stored refusal), `manual`
   * leaves it for the person. An unknown id changes nothing.
   *
   * @throws RangeError when `client_retry` is not among the resolutions the action declared.
   * @throws TypeError when the queue is not open.
   */
  async resolve(id: string, resolution: ConflictResolution): Promise<void> {
    const conflict = this.state.conflicts.find((record) => record.id === id);
    if (conflict === undefined || resolution === ConflictResolution.Manual) return;
    const isRetry = resolution === ConflictResolution.ClientRetry;
    if (isRetry && !OFFLINE_POLICIES.get(conflict.action)?.onConflict.includes(resolution))
      throw new RangeError(`${conflict.action} does not offer ${resolution}`);
    const partition = this.opened();
    const conflicts = this.state.conflicts.filter((record) => record !== conflict);
    const items = isRetry ? [this.retryOf(conflict), ...this.state.items] : this.state.items;
    this.publish({ ...this.state, items, conflicts });
    await this.persist(partition);
    this.replayIfAllowed();
  }

  /**
   * Drops the call or conflict `id` and its local intent; always allowed. An unknown id changes nothing.
   *
   * @throws TypeError when the queue is not open.
   */
  async discard(id: string): Promise<void> {
    const items = this.state.items.filter((item) => item.id !== id);
    const conflicts = this.state.conflicts.filter((record) => record.id !== id);
    if (
      items.length === this.state.items.length &&
      conflicts.length === this.state.conflicts.length
    )
      return;
    const partition = this.opened();
    this.publish({ ...this.state, items, conflicts });
    await this.persist(partition);
    this.replayIfAllowed();
  }

  /** Stops listening to the network and the leader when the container closes. */
  onApplicationShutdown(): void {
    for (const stop of this.stops) stop();
  }

  /** Opens `partition` with `items` and `conflicts` as its state; for `open`, and a subclass that seeds itself (a fake). */
  protected seed(
    partition: string,
    items: readonly PendingMutation[],
    conflicts: readonly ConflictRecord[],
  ): void {
    this.partition = partition;
    this.publish({ items, conflicts, isDraining: false });
  }

  /** Replaces the state and notifies every listener. */
  private publish(next: QueueState): void {
    this.state = next;
    this.changes += 1;
    for (const listener of this.listeners) listener();
  }

  /** The open partition's key. */
  private opened(): string {
    if (this.partition === undefined)
      throw new TypeError(
        "The offline queue is not open: the query context opens it after sign-in",
      );
    return this.partition;
  }

  /** Drains when the configuration replays on its own. */
  private replayIfAllowed(): void {
    if (this.config.replayOnReconnect) void this.drain();
  }

  /** Whether this context may send now. */
  private mayReplay(partition: string): boolean {
    return (
      this.partition === partition &&
      this.leader.isLeader.get() &&
      this.platform.network.isOnline.get()
    );
  }

  /** One drain: passes until nothing new was asked for during the last one. */
  private async run(): Promise<void> {
    const partition = this.partition;
    if (partition === undefined || !this.mayReplay(partition)) return;
    this.publish({ ...this.state, isDraining: true });
    try {
      do {
        this.rerun = false;
        await this.pass(partition);
      } while (this.rerun && this.mayReplay(partition));
    } finally {
      if (this.partition === partition) this.publish({ ...this.state, isDraining: false });
    }
  }

  /** Replays every aggregate a conflict does not block, `maxParallelAggregates` at a time. */
  private async pass(partition: string): Promise<void> {
    const blocked = new Set(this.state.conflicts.map((record) => record.aggregate));
    const lanes = [...new Set(this.state.items.map((item) => item.aggregate))].filter(
      (aggregate) => !blocked.has(aggregate),
    );
    let next = 0;
    const worker = async (): Promise<void> => {
      for (let lane = lanes[next++]; lane !== undefined; lane = lanes[next++])
        await this.replayLane(partition, lane);
    };
    const workers = Math.min(this.config.maxParallelAggregates, lanes.length);
    await Promise.all(Array.from({ length: workers }, worker));
  }

  /** Sends the calls of one aggregate in order until it is empty, a send waits, or a call becomes a conflict. */
  private async replayLane(partition: string, aggregate: string): Promise<void> {
    while (this.mayReplay(partition)) {
      const head = this.state.items.find((item) => item.aggregate === aggregate);
      if (head === undefined) return;
      if (Date.parse(head.expiresAt) <= this.clock.now().getTime())
        return this.settle(partition, head, { code: STALE_CODE, server: null });
      const outcome = await this.send(head);
      if (outcome.ok) await this.settle(partition, head, null);
      else if (outcome.code === null) return;
      else return this.settle(partition, head, { code: outcome.code, server: outcome.server });
    }
  }

  /** Sends `head`, counting a throw as not reached. */
  private async send(head: PendingMutation): Promise<ReplayOutcome> {
    try {
      return await this.sender.send(head.action, head.input, head.id);
    } catch {
      return NOT_REACHED;
    }
  }

  /** Takes `head` out of the queue, as a conflict when `refusal` is given; a call discarded meanwhile stays gone. */
  private async settle(
    partition: string,
    head: PendingMutation,
    refusal: Pick<ConflictRecord, "code" | "server"> | null,
  ): Promise<void> {
    if (this.partition !== partition || !this.state.items.includes(head)) return;
    const items = this.state.items.filter((item) => item !== head);
    const conflicts =
      refusal === null
        ? this.state.conflicts
        : [
            ...this.state.conflicts,
            Object.freeze({ ...head, ...refusal, conflictedAt: this.clock.now().toISOString() }),
          ];
    this.publish({ ...this.state, items, conflicts });
    // A failed write leaves the stored queue one step behind; a replayed call repeats its key, so the server answers
    // it once.
    await this.persist(partition).catch(() => undefined);
  }

  /** The call of `conflict` queued again: a new key, a fresh retention. */
  private retryOf(conflict: ConflictRecord): PendingMutation {
    const now = this.clock.now();
    const retention = Duration.toMilliseconds(Duration.days(this.config.queueRetentionDays));
    return Object.freeze({
      id: globalThis.crypto.randomUUID(),
      action: conflict.action,
      input: conflict.input,
      aggregate: conflict.aggregate,
      queuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + retention).toISOString(),
    });
  }

  /** Writes the current state of `partition`, after every earlier write. */
  private persist(partition: string): Promise<void> {
    const { items, conflicts } = this.state;
    const write = (): Promise<void> =>
      this.persister.write(StorageArea.Outbox, partition, { version: 1, items, conflicts });
    const written = this.saving.then(write, write);
    this.saving = written.catch(() => undefined);
    return written;
  }
}
