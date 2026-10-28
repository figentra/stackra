/**
 * Stackra file contract:
 * Purpose: `Repository<M>`, the reads and writes of one model a class injects as `repositoryOf(M)` when it needs no
 *          service methods: find, count, sum and count-distinct, lock a row (shared, nowait or skip-locked), increment atomically, create in the unit of work, insert
 *          now (for a dedup row), the bulk verbs (`insertMany`, `upsert`, `updateWhere`, `deleteWhere`, `each`,
 *          `chunk`), an offset `page`, and purge.
 * Boundary: a type only; every `CrudService<M>` is one too. Writes made with `create` flush with the caller's unit of
 *           work; `insert` flushes at once in a savepoint (or its own transaction), so a `UniqueViolation` surfaces at
 *           the call and the caller's transaction stays usable.
 * Runtime: node
 * Governing contract: ADR 0097 (decision 5.3: the CRUD API); ADR 0105 as amended by ADR 0294; ADR 0136; data-layer gap mo6 (stackra-279: lock options); mo9 and mo14 (stackra-280: bulk verbs, offset page).
 */
import type {
  EntityData,
  FindOneOptions,
  FindOptions,
  Loaded,
  RequiredEntityData,
} from "@mikro-orm/core";

import type { EachOptions } from "#core/types/each-options.type";
import type { LockOptions } from "#core/types/lock-options.type";
import type { OffsetPage } from "#core/types/offset-page.type";
import type { PageOptions } from "#core/types/page-options.type";
import type { PageQuery } from "#core/types/page-query.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import type { UpsertOptions } from "#core/types/upsert-options.type";
import type { UpsertResult } from "#core/types/upsert-result.type";
import type { Where } from "#contracts/types/where.type";

/**
 * The repository of `M`.
 *
 * @example
 * constructor(private readonly inboxMessages: Repository<InboxMessage>) {}
 * const unread = await this.inboxMessages.count({ principalId, readAt: null });
 */
export interface Repository<M extends object> {
  /** The rows matching `where`. */
  find: <H extends string = never>(
    where: Where<M>,
    options?: FindOptions<M, H>,
  ) => Promise<Loaded<M, H>[]>;

  /** The one row matching `where`, or null. */
  findOne: <H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ) => Promise<Loaded<M, H> | null>;

  /**
   * The one row matching `where`.
   *
   * @throws NotFoundError (a `not_found` refusal) when there is none.
   */
  findOneOrFail: <H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ) => Promise<Loaded<M, H>>;

  /** How many rows match `where`. */
  count: (where?: Where<M>) => Promise<number>;

  /** The sum of a numeric field (`points`, or an embedded `total.minor`) over the rows matching `where`; 0 for none. */
  sum: (field: string, where?: Where<M>) => Promise<number>;

  /** How many distinct non-null values a field (`subjectId`) holds over the rows matching `where`; 0 for none. */
  countDistinct: (field: string, where?: Where<M>) => Promise<number>;

  /**
   * The one row matching `where`, read again and locked until the running transaction ends, so a second caller waits
   * for the first: a single-flight token refresh locks the connection row, then re-checks the expiry it reads before
   * refreshing. The lock is exclusive (`for update`) unless `shared` (`for share`). With `nowait` a held row fails at
   * once (`55P03`); with `skipLocked` a held row is passed over and the first free match is locked, or null comes back
   * when every match is held (a work-queue claim).
   *
   * @throws NotFoundError (a `not_found` refusal) when there is none (never with `skipLocked`); an error when no
   *         transaction is running; a `TypeError` for `nowait` with `skipLocked`.
   */
  lock: {
    (where: Where<M>, options?: LockOptions & { readonly skipLocked?: false }): Promise<M>;
    (where: Where<M>, options: LockOptions): Promise<M | null>;
  };

  /**
   * Adds `by` (default 1, negative to decrease) to a numeric field (`hits`, or an embedded `total.minor`) of every row
   * matching `where` in one statement (`col = col + ?`), so concurrent increments never lose a step; returns how many
   * rows changed. Rows the unit of work already loaded keep their old value until read again.
   */
  increment: (where: Where<M>, field: string, by?: number) => Promise<number>;

  /** A new row, written when the caller's unit of work commits. */
  create: (data: RequiredEntityData<M>) => M;

  /**
   * A new row, written now.
   *
   * @throws UniqueViolation when a unique index refuses it.
   */
  insert: (data: RequiredEntityData<M>, options?: TransactionOptions) => Promise<M>;

  /**
   * New rows, written now in one flush (a savepoint, or a transaction of its own with `requiresNew`): the ORM batches
   * the inserts, and each row is stamped, sealed and recorded on the change feed as `insert` does.
   *
   * @throws UniqueViolation when a unique index refuses one; none is written then.
   */
  insertMany: (
    rows: readonly RequiredEntityData<M>[],
    options?: TransactionOptions,
  ) => Promise<M[]>;

  /**
   * Writes each row: the stored row with the same `by` values is changed, any other is created, all in one flush.
   * Returns the rows in input order with the created and updated counts (an import's `ImportTarget.upsert`).
   *
   * @throws TypeError when `by` is empty, a row lacks a `by` value, or two rows share one key.
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   */
  upsert: (
    rows: readonly RequiredEntityData<M>[],
    options: UpsertOptions,
  ) => Promise<UpsertResult<M>>;

  /**
   * Sets `data` on every row matching `where` and returns how many changed: one statement that also sets the stamps
   * and reports the rows to the change feed, or batches through the unit of work when `data` sets an encrypted field.
   * Rows the unit of work already loaded keep their old values until read again.
   *
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   */
  updateWhere: (where: Where<M>, data: EntityData<M>) => Promise<number>;

  /**
   * Deletes the rows matching `where` by the model's delete policy (soft delete, archive, or a hard delete a legal hold
   * still stops) and returns how many.
   *
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   */
  deleteWhere: (where: Where<M>) => Promise<number>;

  /**
   * The rows matching `where`, one at a time, read in keyset batches of `batch` (500) by the primary key, so a walk
   * over a large table never offsets: `for await (const order of orders.each({ status }))`.
   *
   * @throws TypeError for a batch outside 1 to 10,000 or a composite primary key.
   */
  each: (where?: Where<M>, options?: EachOptions) => AsyncIterable<M>;

  /** The rows matching `where`, a keyset batch at a time, as `each` reads them. */
  chunk: (where?: Where<M>, options?: EachOptions) => AsyncIterable<M[]>;

  /**
   * One numbered page of the rows the caller may see, sorted by the input's keys then the primary key, with the total
   * count (an admin list with page numbers; a long list reads by cursor with `CrudService.table`).
   *
   * @throws TableFilterInvalidError for a page below 1, a page size outside 1 to 500, or more than three sort keys.
   */
  page: <H extends string = never>(
    input: PageQuery,
    options?: PageOptions<M, H>,
  ) => Promise<OffsetPage<Loaded<M, H>>>;

  /**
   * Deletes the rows matching `where` that no legal hold covers and returns how many; retention and purge jobs only.
   */
  purge: (where: Where<M>) => Promise<number>;
}
