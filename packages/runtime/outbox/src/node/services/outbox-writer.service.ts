/**
 * Stackra file contract:
 * Purpose: `OutboxWriterService`, the outbox writer the database's ORM subscribers seam was left for: on each flush it
 *          takes the integration events every changed model recorded and notes a change for every watched model's row
 *          (a model with `CapturesChanges`, or one a change consumer is registered for), then writes them just before
 *          the flush's transaction (or savepoint) commits, inside it: the events to `outbox.messages`, the changes to
 *          the retained change log `outbox.changes`, so they commit with the change or not at all; a rollback drops
 *          them. It is also the database's `NativeWriteWatcher`: a `CrudService` verb that writes with a native
 *          statement reports its rows here, and their changes are appended at once on that statement's transaction.
 * Boundary: passed as one of `DatabaseOptions.subscribers` to `PostgresDatabaseDriver.connect`; its three methods are the
 *           ORM's flush and transaction events, typed structurally so this package never imports MikroORM. Only
 *           integration events are taken: any other recorded event is recorded back on its model, in order, for the
 *           in-process dispatch that owns it. A model's events are taken when it flushes with a change. The call's
 *           actor and id (through @stackra/actions' `ContextStorage`) become each message's actor and correlation id.
 *           It needs the ORM's transactions (the default); a flush with transactions disabled writes nothing. A change
 *           carries `before`/`after` values only when the model's `CapturesChanges` asks for them, never for a field
 *           `changeCaptureOf` drops (encrypted, `@Classified`, excluded), and only JSON values (a relation is left out).
 *           A native write's change names its fields, never their values. The runtime connects it with
 *           `connectNativeWriteWatcher(writer)` at boot.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 3 and 4: written in the same transaction as the change); ADR 0141 (decisions
 *                     2 and 3); ADR 0294 (decision 27: events are recorded beside the model); ADR 0221 (decision 5);
 *                     ADR 0097 (decision 2); STA-1380 (ids from @stackra/contracts' one minter); ADR 0078 and ADR 0221
 *                     (2026-10-28 amendment: the change feed with opt-in values); data-layer gaps cdc1, cdc2 and mo10.
 */
import type { ExtensionContext } from "@stackra/actions";
import type { ContextStorage } from "@stackra/actions/contracts";
import { kindOf, Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { type Clock, mintPublicId } from "@stackra/contracts";
import type { Database, NativeWrite, NativeWriteWatcher } from "@stackra/database";
import { recordEvent, takeRecordedEvents } from "@stackra/events";
import { changeCaptureOf } from "@stackra/model";
import type { ChangeCapture } from "@stackra/model";

import { RowChangeKind } from "#contracts/index";
import type { ChangeRecord, OutboxMessage, RowChange } from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";
import { eventMessage } from "#core/functions/event-message.function";
import { insertChanges } from "#node/functions/insert-changes.function";
import { insertMessages } from "#node/functions/insert-messages.function";
import type { FlushArgs } from "#node/types/flush-args.type";
import type { TransactionArgs } from "#node/types/transaction-args.type";

/** One change set of a flush. */
type ChangeSet = ReturnType<FlushArgs["uow"]["getChangeSets"]>[number];

/** A change-log entry before its position is known. */
type ChangeEntry = Omit<ChangeRecord, "position">;

/** What one entity manager's flushes noted, built at commit. */
interface Noted {
  readonly messages: (() => OutboxMessage)[];
  readonly changes: (() => ChangeEntry)[];
}

/** A value as JSON keeps it: primitives, dates as ISO text, plain arrays and objects; anything else is left out. */
function jsonValue(value: unknown): unknown {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (typeof value === "bigint") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value;
  if (typeof value === "object") {
    const proto: unknown = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) return value;
  }
  return undefined;
}

/** The kept JSON values of `fields` of `source`. */
function valuesOf(
  source: object | undefined,
  fields: readonly string[],
  dropped: ReadonlySet<string>,
): Readonly<Record<string, unknown>> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (dropped.has(field) || source === undefined) continue;
    const value = jsonValue((source as Record<string, unknown>)[field]);
    if (value !== undefined) values[field] = value;
  }
  return Object.freeze(values);
}

/** The row-change kind of an ORM change-set type. */
function changeKindOf(type: string): RowChangeKind {
  if (type === "create") return RowChangeKind.Created;
  return type.startsWith("delete") ? RowChangeKind.Deleted : RowChangeKind.Updated;
}

/**
 * Writes a flush's outbox messages in its transaction.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [writer] });
 */
export class OutboxWriterService extends Service implements NativeWriteWatcher {
  /** Reads when a flush's facts happened. */
  private readonly clock: Clock;

  /** Holds the running action call, whose actor and id each message carries. */
  private readonly storage: ContextStorage;

  /** The messages each entity manager's flushes noted and its transaction has not committed yet, built at commit. */
  private readonly pending = new WeakMap<object, Noted>();

  /**
   * @param clock - the time a flush's facts happened at.
   * @param storage - the storage the action pipeline runs each call in.
   */
  constructor(clock: Clock, storage: ContextStorage) {
    super();
    this.clock = clock;
    this.storage = storage;
  }

  /** The ORM's `onFlush`: notes the flush's integration events and watched row changes, ids minted in flush order. */
  onFlush(args: FlushArgs): void {
    const occurredAt = this.clock.now();
    const meta = this.callMeta();
    const noted: Noted = { messages: [], changes: [] };
    for (const changeSet of args.uow.getChangeSets()) {
      for (const event of takeRecordedEvents(changeSet.entity)) {
        if (kindOf(event.constructor)?.kind !== "integration_event") {
          recordEvent(changeSet.entity, event);
          continue;
        }
        const message = eventMessage({
          event,
          meta: { ...meta, id: mintPublicId("evt", occurredAt.getTime()), occurredAt },
        });
        noted.messages.push(() => message);
      }
      const model = changeSet.entity.constructor as AnyClass;
      if (this.watches(model))
        noted.changes.push(
          this.changeOf(changeSet, model, changeCaptureOf(model), meta, occurredAt),
        );
    }
    if (noted.messages.length === 0 && noted.changes.length === 0) return;
    const earlier = this.pending.get(args.em);
    this.pending.set(args.em, {
      messages: [...(earlier?.messages ?? []), ...noted.messages],
      changes: [...(earlier?.changes ?? []), ...noted.changes],
    });
  }

  /**
   * The ORM's `beforeTransactionCommit`: writes what the transaction's flushes noted, inside it.
   *
   * @throws TypeError when a watched row has no primary key; the statement's error. Either fails the commit.
   */
  async beforeTransactionCommit(args: TransactionArgs): Promise<void> {
    const noted = this.pending.get(args.em);
    if (noted === undefined) return;
    this.pending.delete(args.em);
    const em = args.em as ReturnType<Database["em"]>;
    await insertMessages(
      em,
      noted.messages.map((build) => build()),
    );
    await insertChanges(
      em,
      noted.changes.map((build) => build()),
    );
  }

  /** The ORM's `afterTransactionRollback`: drops what the rolled-back flushes noted. */
  afterTransactionRollback(args: TransactionArgs): void {
    this.pending.delete(args.em);
  }

  /**
   * Implements `NativeWriteWatcher.watches`: a model with `CapturesChanges`, or the very class a change consumer is
   * registered for.
   */
  watches(model: AnyClass): boolean {
    return (
      changeCaptureOf(model) !== undefined || CHANGE_CONSUMERS.get(model.name)?.model === model
    );
  }

  /** Implements `NativeWriteWatcher.written`: appends one change per row on the native statement's transaction. */
  async written(write: NativeWrite): Promise<void> {
    const occurredAt = this.clock.now();
    const meta = this.callMeta();
    await insertChanges(
      write.em,
      write.ids.map((id) => ({
        change: Object.freeze({
          model: write.model.name,
          id,
          kind: write.kind,
          fields: write.kind === RowChangeKind.Deleted ? [] : [...write.fields],
        }),
        meta,
        occurredAt,
      })),
    );
  }

  /** The change of one change set, built at commit, once the row's primary key is known. */
  private changeOf(
    changeSet: ChangeSet,
    model: AnyClass,
    capture: ChangeCapture | undefined,
    meta: OutboxMessage["meta"],
    occurredAt: Date,
  ): () => ChangeEntry {
    const kind = changeKindOf(changeSet.type);
    const fields = kind === RowChangeKind.Deleted ? [] : Object.keys(changeSet.payload);
    const values = capture?.values === true ? capture.dropped : undefined;
    // Read now: the snapshot and the entity move on once the flush completes.
    const before =
      values === undefined || kind === RowChangeKind.Created
        ? undefined
        : valuesOf(
            changeSet.originalEntity,
            kind === RowChangeKind.Deleted ? Object.keys(changeSet.originalEntity ?? {}) : fields,
            values,
          );
    const after =
      values === undefined || kind === RowChangeKind.Deleted
        ? undefined
        : valuesOf(changeSet.entity, fields, values);
    return () => {
      const key = changeSet.getSerializedPrimaryKey();
      if (key === null)
        throw new TypeError(`A ${model.name} row was flushed without a primary key`);
      const change: RowChange = {
        model: model.name,
        id: key,
        kind,
        fields,
        ...(before === undefined ? {} : { before }),
        ...(after === undefined ? {} : { after }),
      };
      return Object.freeze({ change: Object.freeze(change), meta, occurredAt });
    };
  }

  /** The running call's actor and id, when a flush runs inside an action. */
  private callMeta(): OutboxMessage["meta"] {
    const call = this.storage.current() as Partial<ExtensionContext> | undefined;
    return Object.freeze({
      ...(call?.actor === undefined ? {} : { actor: call.actor }),
      ...(call?.callId === undefined ? {} : { correlationId: call.callId }),
    });
  }
}
