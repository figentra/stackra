/**
 * Stackra file contract:
 * Purpose: `Repository<M>`, the reads and writes of one model a class injects as `repositoryOf(M)` when it needs no
 *          service methods: find, count, sum and count-distinct, create in the unit of work, insert now (for a dedup row), and purge.
 * Boundary: a type only; every `CrudService<M>` is one too. Writes made with `create` flush with the caller's unit of
 *           work; `insert` flushes at once in a savepoint (or its own transaction), so a `UniqueViolation` surfaces at
 *           the call and the caller's transaction stays usable.
 * Runtime: node
 * Governing contract: ADR 0097 (decision 5.3: the CRUD API); ADR 0105 as amended by ADR 0294; ADR 0136.
 */
import type { FindOneOptions, FindOptions, Loaded, RequiredEntityData } from "@mikro-orm/core";

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
  find<H extends string = never>(
    where: Where<M>,
    options?: FindOptions<M, H>,
  ): Promise<Loaded<M, H>[]>;

  /** The one row matching `where`, or null. */
  findOne<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ): Promise<Loaded<M, H> | null>;

  /**
   * The one row matching `where`.
   *
   * @throws NotFoundError (a `not_found` refusal) when there is none.
   */
  findOneOrFail<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ): Promise<Loaded<M, H>>;

  /** How many rows match `where`. */
  count(where?: Where<M>): Promise<number>;

  /** The sum of a numeric field (`points`, or an embedded `total.minor`) over the rows matching `where`; 0 for none. */
  sum(field: string, where?: Where<M>): Promise<number>;

  /** How many distinct non-null values a field (`subjectId`) holds over the rows matching `where`; 0 for none. */
  countDistinct(field: string, where?: Where<M>): Promise<number>;

  /** A new row, written when the caller's unit of work commits. */
  create(data: RequiredEntityData<M>): M;

  /**
   * A new row, written now.
   *
   * @throws UniqueViolation when a unique index refuses it.
   */
  insert(data: RequiredEntityData<M>, options?: TransactionOptions): Promise<M>;

  /**
   * Deletes the rows matching `where` that no legal hold covers and returns how many; retention and purge jobs only.
   */
  purge(where: Where<M>): Promise<number>;
}
