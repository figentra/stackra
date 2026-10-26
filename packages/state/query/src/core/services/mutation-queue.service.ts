/**
 * Stackra file contract:
 * Purpose: `MutationQueue`, the offline mutation queue of a client: it holds the calls the offline map lets it queue,
 *          each with the Idempotency-Key minted when it was queued and the device that queued it, persists them in the
 *          `outbox` area, replays them one at a time in the order they were queued when this context leads and the
 *          network is up, stamps each call's per-device sequence number when it is first sent, refuses a capped action
 *          past its cap (counting the calls it holds and the capped calls it sent within the window), and turns a
 *          refusal for good or an expired call into a conflict record a person resolves (`useMutationQueue()` reads it).
 * Boundary: a singleton service; the host's query context calls `open(partition)` after sign-in and on every switch,
 *           so a call is only ever replayed for the principal and scope that queued it. Per-device order (ADR 0338
 *           decision 1): a later call is never sent before an earlier one was accepted or refused, so a call that did
 *           not reach the server stops the replay. A conflict blocks the later calls of its aggregate until it is
 *           resolved or discarded, and nothing is overwritten silently (ADR 0059 decision 3); the other aggregates go
 *           on, each call taking its sequence when it leaves. A failed send that may succeed later keeps the entry; a
 *           call that fails to persist is not queued. A capped call is refused with the pipeline's own refusal
 *           (`@stackra/actions`' `OfflineCapReachedError`), and every waiting call counts against the cap whatever its
 *           age, because the server counts it when it applies it. An `OfflineLock` wipe closes the queue until the next
 *           `open`. No sync engine: replay is the action call with its key (ADR 0227 row).
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decisions 2 and 3); ADR 0252 (decision 2: retention, a leader, per-aggregate order);
 *                     ADR 0338 (decisions 1, 4 and 5); ADR 0138 (the idempotency step); ADR 0294 (decisions 16 and 17).
 */
import { ConflictResolution, OfflineCapReachedError, OfflineMode } from "@stackra/actions";
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Json, Clock } from "@stackra/contracts";
import type { DeviceIdentity } from "@stackra/devices/contracts";
import type { Platform } from "@stackra/platform/contracts";
import { StorageArea } from "@stackra/storage";
import { duration } from "@stackra/validation";

import type { QueryConfig } from "#config/query.config";
import type { MutationSender } from "#contracts/ports/mutation-sender.port";
import type { QueryPersister } from "#contracts/ports/query-persister.port";
import type { QueueLeader } from "#contracts/ports/queue-leader.port";
import type { ReplayOutcome } from "#contracts/types/replay-outcome.type";
import { OFFLINE_POLICIES } from "#core/constants/offline-policies.constant";
import { PERSISTED_QUEUE_SCHEMA } from "#core/constants/persisted-queue-schema.constant";
import { OfflineError } from "#core/errors/offline.error";
import { partitionKey } from "#core/functions/partition-key.function";
import type { OfflineLock } from "#core/services/offline-lock.service";
import type { ConflictRecord } from "#core/types/conflict-record.type";
import type { OfflineActionRef } from "#core/types/offline-action-ref.type";
import type { OfflineCap } from "#core/types/offline-cap.type";
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

/** A capped call the server accepted: what it counts against the cap until its window passes. */
interface CapUse {
  readonly action: string;
  readonly at: string;
  readonly amount: number;
}

/** A plain JSON object. */
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The minor units a call's input spends in its cap's amount field (a `Money` wire form or minor units). */
function amountOf(input: Json, cap: OfflineCap): number {
  const amount = isRecord(input) ? input[cap.amountField ?? "amount"] : undefined;
  if (typeof amount === "number") return amount;
  return isRecord(amount) && typeof amount["minor"] === "number" ? amount["minor"] : 0;
}

/**
 * The offline mutation queue.
 *
 * @example
 * await queue.open({ principal: session.user.userId, scope: activeScope });
 * await queue.enqueue(CreateOrderAction, input, input.orderId); // offline
 * queue.pending; // 1, until the network returns and the leader drains it
 */
export class MutationQueue extends Service {
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

  private readonly config: QueryConfig;

  private readonly persister: QueryPersister;

  private readonly sender: MutationSender;

  private readonly leader: QueueLeader;

  private readonly platform: Platform;

  private readonly clock: Clock;

  private readonly device: DeviceIdentity;

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

  /** The device of the open partition. */
  private deviceId = "";

  /** The last sequence this device stamped, as far as this context knows. */
  private lastSequence = 0;

  /** The capped calls the server accepted, still within their window; persisted with the queue. */
  private spent: readonly CapUse[] = [];

  /**
   * @param config - scope, replay and retention.
   * @param persister - keeps the queue in the `outbox` area.
   * @param sender - sends one call with its Idempotency-Key and device order.
   * @param leader - whether this context drains.
   * @param platform - the network signal.
   * @param clock - stamps and expires entries.
   * @param device - this device's id, carried by every call.
   * @param lock - closes the queue when the device's offline data is wiped.
   */
  constructor(
    config: QueryConfig,
    persister: QueryPersister,
    sender: MutationSender,
    leader: QueueLeader,
    platform: Platform,
    clock: Clock,
    device: DeviceIdentity,
    lock: OfflineLock,
  ) {
    super();
    this.config = config;
    this.persister = persister;
    this.sender = sender;
    this.leader = leader;
    this.platform = platform;
    this.clock = clock;
    this.device = device;
    const replayWhenOn = (isOn: boolean): void => {
      if (isOn) this.replayIfAllowed();
    };
    this.stops = [
      platform.network.isOnline.subscribe(replayWhenOn),
      leader.isLeader.subscribe(replayWhenOn),
      lock.onWipe(() => this.close()),
    ];
  }

  /** The calls waiting for the network, in the order they were queued. */
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

  /** Stops listening to the network, the leader and the lock when the container closes. */
  onApplicationShutdown(): void {
    for (const stop of this.stops) stop();
  }

  /**
   * Opens the queue of `partition`: reads what it persisted (upgrading a version 1 queue to this device), then replays
   * it when allowed. Until it resolves the queue is closed, so nothing is queued or replayed against the wrong
   * principal or scope.
   *
   * @throws TypeError when what is stored is not a queue this version can read; it is left untouched.
   * @throws Error the persister's or the device identity's error; the queue stays closed.
   */
  async open(partition: QueryPartition): Promise<void> {
    const key = `query.queue.${partitionKey(this.config.scope, partition)}`;
    const ticket = ++this.opens;
    this.partition = undefined;
    this.publish(EMPTY);
    const [stored, deviceId] = await Promise.all([
      this.persister.read(StorageArea.Outbox, key),
      this.device.id(),
    ]);
    if (ticket !== this.opens) return;
    const parsed = PERSISTED_QUEUE_SCHEMA.safeParse(
      stored ?? { version: 2, items: [], conflicts: [] },
    );
    if (!parsed.success)
      throw new TypeError(`The stored offline queue under ${key} cannot be read; it was kept`);
    const queue = parsed.data;
    if (queue.version === 2) {
      this.seed(key, deviceId, queue.items, queue.conflicts);
      this.spent = queue.spent;
    } else
      this.seed(
        key,
        deviceId,
        queue.items.map((item) => Object.freeze({ ...item, deviceId, sequence: null })),
        queue.conflicts.map((record) => Object.freeze({ ...record, deviceId, sequence: null })),
      );
    this.replayIfAllowed();
  }

  /**
   * Queues a call to `action` with `input`, after every earlier call, and resolves once it is persisted. Its expiry is
   * the action's declared retention, at most `queueRetentionDays`.
   *
   * @param aggregate - the record the call changes (its public id); calls without one share a lane.
   * @throws OfflineError when the offline map does not let the queue hold `action`.
   * @throws OfflineCapReachedError when the action's offline cap is reached within its window.
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
    if (policy.cap !== undefined) this.refuseOverCap(key, input, policy.cap, now);
    const retention = Math.min(
      Duration.toMilliseconds(duration(policy.retention)),
      Duration.toMilliseconds(Duration.days(this.config.queueRetentionDays)),
    );
    const entry: PendingMutation = Object.freeze({
      id: globalThis.crypto.randomUUID(),
      action: key,
      input,
      aggregate,
      deviceId: this.deviceId,
      sequence: null,
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
   * again ahead of the waiting calls with a new Idempotency-Key (the old key would replay the stored refusal) and a new
   * sequence when it leaves, `manual` leaves it for the person. An unknown id changes nothing.
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

  /**
   * Opens `partition` for `deviceId` with `items` and `conflicts` as its state; for `open`, and a subclass that seeds
   * itself (a fake).
   */
  protected seed(
    partition: string,
    deviceId: string,
    items: readonly PendingMutation[],
    conflicts: readonly ConflictRecord[],
  ): void {
    this.partition = partition;
    this.deviceId = deviceId;
    this.spent = [];
    for (const call of [...items, ...conflicts])
      this.lastSequence = Math.max(this.lastSequence, call.sequence ?? 0);
    this.publish({ items, conflicts, isDraining: false });
  }

  /** Closes the queue and drops what it holds, once every write in flight has landed; the lock wipes the area next. */
  private async close(): Promise<void> {
    this.partition = undefined;
    this.opens += 1;
    this.spent = [];
    this.publish(EMPTY);
    await this.saving;
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

  /**
   * Refuses the call when it would pass the action's offline cap within its window.
   *
   * @throws OfflineCapReachedError when the count or the amount would pass the cap.
   */
  private refuseOverCap(action: string, input: Json, cap: OfflineCap, now: Date): void {
    const since = now.getTime() - Duration.toMilliseconds(duration(cap.window));
    const sent = this.spent.filter((use) => use.action === action && Date.parse(use.at) > since);
    const amounts = [
      ...sent.map((use) => use.amount),
      ...this.state.items
        .filter((item) => item.action === action)
        .map((item) => amountOf(item.input, cap)),
      amountOf(input, cap),
    ];
    const amount = amounts.reduce((sum, value) => sum + value, 0);
    if (
      (cap.count !== undefined && amounts.length > cap.count) ||
      (cap.amount !== undefined && amount > cap.amount)
    )
      throw OfflineCapReachedError.create();
  }

  /** `spent` with the accepted `head` when its action is capped, without the uses whose window has passed. */
  private spentAfter(head: PendingMutation): readonly CapUse[] {
    const now = this.clock.now();
    const kept = this.spent.filter((use) => {
      const cap = OFFLINE_POLICIES.get(use.action)?.cap;
      return (
        cap !== undefined &&
        Date.parse(use.at) > now.getTime() - Duration.toMilliseconds(duration(cap.window))
      );
    });
    const cap = OFFLINE_POLICIES.get(head.action)?.cap;
    if (cap === undefined) return kept;
    return [
      ...kept,
      Object.freeze({
        action: head.action,
        at: now.toISOString(),
        amount: amountOf(head.input, cap),
      }),
    ];
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
      let reachedAll: boolean;
      do {
        this.rerun = false;
        reachedAll = await this.pass(partition);
        // A head that did not reach the server waits for the next drain; asking again mid-pass is no reason to resend.
      } while (reachedAll && this.rerun && this.mayReplay(partition));
    } finally {
      if (this.partition === partition) this.publish({ ...this.state, isDraining: false });
    }
  }

  /**
   * Sends the waiting calls one at a time in queue order, skipping the aggregates a conflict blocks, until none is
   * left, one did not reach the server (nothing later may go before it), or the replay is no longer allowed. Resolves
   * `false` when it stopped at a call that did not reach the server.
   */
  private async pass(partition: string): Promise<boolean> {
    const blocked = new Set(this.state.conflicts.map((record) => record.aggregate));
    while (this.mayReplay(partition)) {
      const next = this.state.items.find((item) => !blocked.has(item.aggregate));
      if (next === undefined) return true;
      if (Date.parse(next.expiresAt) <= this.clock.now().getTime()) {
        await this.settle(partition, next, { code: STALE_CODE, server: null });
        blocked.add(next.aggregate);
        continue;
      }
      const head = next.sequence === null ? await this.stamp(partition, next) : next;
      if (head === undefined) return true;
      const outcome = await this.send(head);
      if (outcome.ok) await this.settle(partition, head, null);
      else if (outcome.code === null) return false;
      else {
        await this.settle(partition, head, { code: outcome.code, server: outcome.server });
        blocked.add(head.aggregate);
      }
    }
    return true;
  }

  /**
   * Gives `entry` the device's next sequence and persists it before it is sent, so every resend repeats it; a call
   * discarded meanwhile stays gone (`undefined`).
   */
  private async stamp(
    partition: string,
    entry: PendingMutation,
  ): Promise<PendingMutation | undefined> {
    if (this.partition !== partition || !this.state.items.includes(entry)) return undefined;
    // Strictly increasing on the device: a clock reading keeps it ahead of what another tab stamped while it led.
    this.lastSequence = Math.max(this.lastSequence + 1, this.clock.now().getTime());
    const stamped: PendingMutation = Object.freeze({ ...entry, sequence: this.lastSequence });
    this.publish({
      ...this.state,
      items: this.state.items.map((item) => (item === entry ? stamped : item)),
    });
    // A lost write restamps the call after a restart; its key still makes the server answer it once.
    await this.persist(partition).catch(() => undefined);
    return this.partition === partition && this.state.items.includes(stamped) ? stamped : undefined;
  }

  /** Sends `head`, counting a throw as not reached. */
  private async send(head: PendingMutation): Promise<ReplayOutcome> {
    try {
      return await this.sender.send(head.action, head.input, head.id, {
        deviceId: head.deviceId,
        sequence: head.sequence ?? this.lastSequence,
      });
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
    if (refusal === null) this.spent = this.spentAfter(head);
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

  /** The call of `conflict` queued again: a new key, no sequence yet, a fresh retention. */
  private retryOf(conflict: ConflictRecord): PendingMutation {
    const now = this.clock.now();
    const retention = Duration.toMilliseconds(Duration.days(this.config.queueRetentionDays));
    return Object.freeze({
      id: globalThis.crypto.randomUUID(),
      action: conflict.action,
      input: conflict.input,
      aggregate: conflict.aggregate,
      deviceId: conflict.deviceId,
      sequence: null,
      queuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + retention).toISOString(),
    });
  }

  /** Writes the current state of `partition`, after every earlier write. */
  private persist(partition: string): Promise<void> {
    const { items, conflicts } = this.state;
    const spent = this.spent;
    const write = (): Promise<void> =>
      this.persister.write(StorageArea.Outbox, partition, { version: 2, items, conflicts, spent });
    const written = this.saving.then(write, write);
    this.saving = written.catch(() => undefined);
    return written;
  }
}
