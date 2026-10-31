/**
 * Stackra file contract:
 * Purpose: `RecordedEventsSubscriber`, the testing tier's stand-in for the outbox writer: on each flush it takes the
 *          events every changed model recorded (`model.record(event)`), and once the outermost transaction commits it
 *          hands them to the testing app (`commitEvents`), so `run()` results and `app.events.published()` hold them.
 *          A rollback drops them (STA-1740).
 * Boundary: test only; `MemoryDatabaseDriver` and `usePostgres` connect one with their ORM. A savepoint that is
 *           released carries its events to the transaction around it, and one rolled back drops its own. shortcut:
 *           the carried events are one list per database, so two top-level transactions interleaved on `usePostgres`
 *           could swap them; key them by the outer transaction if a test ever needs that.
 * Runtime: node
 * Governing contract: ADR 0078 (decisions 3 and 4: after commit, never on rollback); ADR 0141 (recorded events reach the
 *                     outbox at flush); ADR 0294 (decision 27); ADR 0269 (decision 3).
 */
import type { EventSubscriber, FlushEventArgs, TransactionEventArgs } from "@mikro-orm/core";
import { takeRecordedEvents } from "@stackra/events";
import type { Event } from "@stackra/events";
import { commitEvents } from "@stackra/events/testing";

/** Whether `args` is a savepoint's release or rollback rather than the outer transaction's. */
function isSavepoint(args: TransactionEventArgs): boolean {
  return args.transaction?.savepointName !== undefined;
}

/**
 * Collects recorded events at flush and publishes them after commit.
 *
 * @example
 * new MikroORM({ ..., subscribers: [new RecordedEventsSubscriber()] });
 */
export class RecordedEventsSubscriber implements EventSubscriber<object> {
  /** What each entity manager's flushes took and its transaction has not ended yet, oldest first. */
  private readonly pending = new WeakMap<object, Event[]>();

  /** What released savepoints carried to the transaction around them, oldest first. */
  private carried: Event[] = [];

  /** The ORM's `onFlush`: takes each changed model's recorded events. */
  onFlush(args: FlushEventArgs): void {
    const taken = args.uow
      .getChangeSets()
      .flatMap((changeSet) => takeRecordedEvents(changeSet.entity));
    if (taken.length > 0)
      this.pending.set(args.em, [...(this.pending.get(args.em) ?? []), ...taken]);
  }

  /** The ORM's `afterTransactionCommit`: a savepoint carries its events outward; the outer one publishes them all. */
  async afterTransactionCommit(args: TransactionEventArgs): Promise<void> {
    const events = this.take(args.em);
    if (isSavepoint(args)) {
      this.carried.push(...events);
      return;
    }
    const committed = [...this.carried, ...events];
    this.carried = [];
    await commitEvents(committed);
  }

  /** The ORM's `afterTransactionRollback`: drops the rolled-back flushes' events, and the carried ones with the outer. */
  afterTransactionRollback(args: TransactionEventArgs): void {
    this.take(args.em);
    if (!isSavepoint(args)) this.carried = [];
  }

  /** Removes and returns what `em`'s flushes took. */
  private take(em: object): Event[] {
    const events = this.pending.get(em) ?? [];
    this.pending.delete(em);
    return events;
  }
}
