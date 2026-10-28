/**
 * Stackra file contract:
 * Purpose: `Repository<M>`, the reads and writes of one model a class injects as `repositoryOf(M)` when it needs no
 *          service methods: find, count, sum and count-distinct, lock a row (shared, nowait or skip-locked), increment atomically, create in the unit of work, insert
 *          now (for a dedup row), and purge.
 * Boundary: a type only; every `CrudService<M>` is one too. Writes made with `create` flush with the caller's unit of
 *           work; `insert` flushes at once in a savepoint (or its own transaction), so a `UniqueViolation` surfaces at
 *           the call and the caller's transaction stays usable.
 * Runtime: node
 * Governing contract: ADR 0097 (decision 5.3: the CRUD API); ADR 0105 as amended by ADR 0294; ADR 0136; data-layer gap mo6 (stackra-279: lock options).
 */
import type { FindOneOptions, FindOptions, Loaded, RequiredEntityData } from "@mikro-orm/core";

import type { LockOptions } from "#core/types/lock-options.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";
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
   * Deletes the rows matching `where` that no legal hold covers and returns how many; retention and purge jobs only.
   */
  purge: (where: Where<M>) => Promise<number>;
}
