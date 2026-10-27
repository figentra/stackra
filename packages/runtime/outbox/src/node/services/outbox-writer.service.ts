/**
 * Stackra file contract:
 * Purpose: `OutboxWriterService`, the outbox writer the database's ORM subscribers seam was left for: on each flush it
 *          takes the integration events every changed model recorded and notes a change message for every watched
 *          model's row, then writes them all just before the flush's transaction (or savepoint) commits, inside it, so
 *          they commit with the change or not at all; a rollback drops them.
 * Boundary: passed as one of `DatabaseOptions.subscribers` to `PostgresDatabaseDriver.connect`; its three methods are the
 *           ORM's flush and transaction events, typed structurally so this package never imports MikroORM. Only
 *           integration events are taken: any other recorded event is recorded back on its model, in order, for the
 *           in-process dispatch that owns it. A model's events are taken when it flushes with a change. The call's
 *           actor and id (through @stackra/actions' `ContextStorage`) become each message's actor and correlation id.
 *           It needs the ORM's transactions (the default); a flush with transactions disabled writes nothing.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 3 and 4: written in the same transaction as the change); ADR 0141 (decisions
 *                     2 and 3); ADR 0294 (decision 27: events are recorded beside the model); ADR 0221 (decision 5);
 *                     ADR 0097 (decision 2); STA-1380 (ids from @stackra/contracts' one minter).
 */
import type { ExtensionContext } from "@stackra/actions";
import type { ContextStorage } from "@stackra/actions/contracts";
import { kindOf, Service } from "@stackra/container";
import { type Clock, mintPublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { recordEvent, takeRecordedEvents } from "@stackra/events";

import { MessageKind, RowChangeKind } from "#contracts/index";
import type { OutboxMessage, RowChange } from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";
import { eventMessage } from "#core/functions/event-message.function";
import { insertMessages } from "#node/functions/insert-messages.function";
import type { FlushArgs } from "#node/types/flush-args.type";
import type { TransactionArgs } from "#node/types/transaction-args.type";

/** One change set of a flush. */
type ChangeSet = ReturnType<FlushArgs["uow"]["getChangeSets"]>[number];

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
export class OutboxWriterService extends Service {
  /** Reads when a flush's facts happened. */
  private readonly clock: Clock;

  /** Holds the running action call, whose actor and id each message carries. */
  private readonly storage: ContextStorage;

  /** The messages each entity manager's flushes noted and its transaction has not committed yet, built at commit. */
  private readonly pending = new WeakMap<object, (() => OutboxMessage)[]>();

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
    const noted: (() => OutboxMessage)[] = [];
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
        noted.push(() => message);
      }
      const watch = CHANGE_CONSUMERS.get(changeSet.entity.constructor.name);
      if (watch?.model === changeSet.entity.constructor)
        noted.push(this.changeOf(changeSet, watch.model.name, meta, occurredAt));
    }
    if (noted.length > 0)
      this.pending.set(args.em, [...(this.pending.get(args.em) ?? []), ...noted]);
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
    await insertMessages(
      args.em as ReturnType<Database["em"]>,
      noted.map((build) => build()),
    );
  }

  /** The ORM's `afterTransactionRollback`: drops what the rolled-back flushes noted. */
  afterTransactionRollback(args: TransactionArgs): void {
    this.pending.delete(args.em);
  }

  /** The change message of one change set, built at commit, once the row's primary key is known. */
  private changeOf(
    changeSet: ChangeSet,
    model: string,
    meta: OutboxMessage["meta"],
    occurredAt: Date,
  ): () => OutboxMessage {
    const id = mintPublicId("evt", occurredAt.getTime());
    const kind = changeKindOf(changeSet.type);
    const fields = kind === RowChangeKind.Deleted ? [] : Object.keys(changeSet.payload);
    return () => {
      const key = changeSet.getSerializedPrimaryKey();
      if (key === null) throw new TypeError(`A ${model} row was flushed without a primary key`);
      const change: RowChange = { model, id: key, kind, fields };
      return Object.freeze({
        id,
        kind: MessageKind.Change,
        type: model,
        data: change,
        meta,
        occurredAt,
        attempts: 0,
        availableAt: occurredAt,
      });
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
