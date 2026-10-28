/**
 * Stackra file contract:
 * Purpose: `CrudService<M>`, the kind base of a module service over one model: `class OrderService extends
 *          CrudService<Order>` inherits the repository reads and writes, `update`, the table read of a resource
 *          (`table(input, { where, period, count })`, with range, date-range, comparison, contains and null filters, a
 *          multi-key sort and the row count) and the metrics of a KPI (`metrics(period, { on, timeZone })`: any
 *          aggregate, a series by hour to quarter in the call's time zone, a breakdown by a dimension).
 * Boundary: a service (it extends container's `Service`, so its binding kind is `service`); its own constructor
 *           dependencies are the subclass's, and it calls `super()` with none. The model comes from the type argument,
 *           which gen registers; the entity manager is the running context's, so every method runs inside the
 *           caller's transaction (an action's unit of work) and a query reads on a fork. A hand-written method of the
 *           same name overrides an inherited one. Every read (`find`, `findOne`, `findOneOrFail`, `count`, `sum`,
 *           `countDistinct`, `table`, `metrics`, and `lock`, which also takes a row lock: exclusive or shared, waiting,
 *           `nowait` or `skipLocked`) ANDs in the bound
 *           `VisibilityFilter`'s conditions, on top of row-level security; writes (`increment` among them) and `purge`
 *           carry none. `update` takes the caller's `expectedVersion`. Database errors stay the
 *           driver's here (a caller may catch `UniqueViolation`); the action's unit of work raises them as refusals.
 *           Native updates (`increment`, `repath`) set the
 *           `Timestamps`/`UserStamps` fields themselves, since no entity event fires for them, and report the rows they
 *           reach to the connected `NativeWriteWatcher` (the outbox change feed) when it watches the model. Deletes follow the model's delete policy (ADR 0134 d4): `delete` soft-deletes
 *           or archives a `SoftDeletes`/`Archivable` model's rows and hard-deletes any other's, `restore` brings kept
 *           rows back, `forceDelete` and `purge` remove them for good; the drivers' `deleted`/`archived` filters hide
 *           kept rows from every read unless `DeletedReadOptions` asks for them. `purge` skips every row the connected `HoldRegistry` holds. `repath` moves
 *           a scope subtree's rows to a new path prefix, the step every service takes when a scope node moves. An
 *           `AppendOnly` model's rows are never changed: `update`, `updateWhere`, `upsert`, `increment`, `delete`,
 *           `deleteWhere`, `restore` and `repath` refuse with `AppendOnlyWriteError`; `purge` and `forceDelete`
 *           (retention, erasure) still remove them. The bulk verbs match the flush path: `insertMany` and `upsert` write
 *           through one flush (stamps, encryption and change records from the subscribers), `updateWhere` is one native
 *           statement with stamps and a change report (a flush when it sets an encrypted field), `deleteWhere` is
 *           `delete`; `each`/`chunk` walk by keyset and `page` reads a numbered page with its total. No write takes a
 *           system field (`SYSTEM_FIELDS` of the model's traits) from its caller: `SystemFieldWriteError`, except the
 *           id of a new row.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0097 (decision 5.3); ADR 0307 (rules 2 and 16);
 *                     ADR 0305 (rule 5: partner by type argument); ADR 0136 (decision 2); ADR 0333 (decision 4);
 *                     ADR 0134 (2026-10-24 amendment: legal holds); ADR 0411 (subtree move); STA-1239 (row lock,
 *                     atomic increment, `update` with `requiresNew`); reporting gaps 5 (filter operators, multi-key sort)
 *                     and 6 (table counts) and 10 (metrics grains, aggregates and breakdown);
 *                     data-layer gaps mo5 and mo6 (`expectedVersion`, database errors as refusals); mo10 (native writes
 *                     reach the change feed); mo3 (`AppendOnly` enforced); mo6 P1 part (`lock` options);
 *                     mo9, mo14 and sc9 (bulk verbs, `each`/`chunk`, offset `page`); ADR 0367 (`upsert`); mo21 (system fields).
 */
import { LockMode, TransactionPropagation, raw } from "@mikro-orm/core";
import type {
  CountOptions,
  EntityData,
  FilterQuery,
  FindOneOptions,
  FindOptions,
  Loaded,
  RequiredEntityData,
} from "@mikro-orm/core";
import type { EntityManager, QBFilterQuery } from "@mikro-orm/postgresql";
import type { Period } from "@stackra/actions";
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { SortDirection } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { encryptedFieldsOf, systemFieldsOf, traitsOf } from "@stackra/model";

import { BULK_LIMITS } from "#core/constants/bulk-limits.constant";
import { DELETE_FILTERS } from "#core/constants/delete-filters.constant";
import { AppendOnlyWriteError } from "#core/errors/append-only-write.error";
import { SystemFieldWriteError } from "#core/errors/system-field-write.error";
import { TableFilterInvalidError } from "#core/errors/table-filter-invalid.error";
import { HOLD_HOST } from "#core/constants/hold-host.constant";
import { HOLD_LINK_FIELDS } from "#core/constants/hold-link-fields.constant";
import { NATIVE_WRITE_HOST } from "#core/constants/native-write-host.constant";
import { LTREE_PATH } from "#core/constants/ltree-path.constant";
import { callTimeZone } from "#core/functions/call-time-zone.function";
import { columnOf } from "#core/functions/column-of.function";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { filterCondition } from "#core/functions/filter-condition.function";
import { filterOf } from "#core/functions/filter-of.function";
import { holdLinksOf } from "#core/functions/hold-links-of.function";
import { isAppendOnly } from "#core/functions/is-append-only.function";
import { modelOf } from "#core/functions/model-of.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { rowKey } from "#core/functions/row-key.function";
import { stampFields } from "#core/functions/stamp-fields.function";
import { tableCount } from "#core/functions/table-count.function";
import { StaleVersionError } from "#core/errors/stale-version.error";
import { visibleFilter } from "#core/functions/visible-filter.function";
import { watchedNativeWrite } from "#core/functions/watched-native-write.function";
import { Database } from "#core/ports/database.port";
import type { EachOptions } from "#core/types/each-options.type";
import type { MetricsOptions } from "#core/types/metrics-options.type";
import type { OffsetPage } from "#core/types/offset-page.type";
import type { PageOptions } from "#core/types/page-options.type";
import type { PageQuery } from "#core/types/page-query.type";
import type { NativeWrite } from "#core/types/native-write.type";
import type { Repository } from "#core/types/repository.type";
import type { TableOptions } from "#core/types/table-options.type";
import type { TablePage } from "#core/types/table-page.type";
import type { TableQuery } from "#core/types/table-query.type";
import type { DeletedReadOptions } from "#core/types/deleted-read-options.type";
import type { LockOptions } from "#core/types/lock-options.type";
import type { TableSort } from "#core/types/table-sort.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import type { UpdateOptions } from "#core/types/update-options.type";
import type { UpsertOptions } from "#core/types/upsert-options.type";
import type { UpsertResult } from "#core/types/upsert-result.type";
import { Disposal } from "#contracts/enums/disposal.enum";
import type { Where } from "#contracts/types/where.type";
import { MetricsReader } from "#core/values/metrics-reader.value";

/** The system field a create may set: a caller may mint the id of a new row (a dedup row, an idempotent import). */
const CREATE_ALLOWED: readonly string[] = ["id"];

/** The most keys a table sort takes before the primary key; each one needs an index to stay fast. */
const MAX_SORT_KEYS = 3;

/** A nested object for a dotted path: `nest("totals.totalMinor", "desc")` is `{ totals: { totalMinor: "desc" } }`. */
function nest(path: string, value: unknown): Record<string, unknown> {
  return path
    .split(".")
    .reduceRight<Record<string, unknown>>((inner, key) => ({ [key]: inner }), value as never);
}

/**
 * The base of a module service over `M`.
 *
 * @example
 * export class OrderService extends CrudService<Order> {
 *   constructor(private readonly lifecycle: OrderStateMachine) {
 *     super();
 *   }
 *
 *   findStale(cutoff: Date, limit: number): Promise<Order[]> {
 *     return this.find({ status: OrderStatus.PendingPayment, createdAt: { $lt: cutoff } }, { limit });
 *   }
 * }
 */
export abstract class CrudService<M extends object> extends Service implements Repository<M> {
  /** Implements `Repository.find`, documented there; `DeletedReadOptions` reach the rows a delete policy hides. */
  async find<H extends string = never>(
    where: Where<M>,
    options?: FindOptions<M, H> & DeletedReadOptions,
  ): Promise<Loaded<M, H>[]> {
    const [filter, rest] = await this.readOf(where, options);
    return this.em().find(this.model(), filter, rest);
  }

  /** Implements `Repository.findOne`, documented there; `DeletedReadOptions` reach the rows a delete policy hides. */
  async findOne<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H> & DeletedReadOptions,
  ): Promise<Loaded<M, H> | null> {
    const [filter, rest] = await this.readOf(where, options);
    return this.em().findOne(this.model(), filter, rest);
  }

  /**
   * Implements `Repository.findOneOrFail`, documented there.
   *
   * @throws NotFoundError when no row matches, or none the caller may see.
   */
  async findOneOrFail<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H> & DeletedReadOptions,
  ): Promise<Loaded<M, H>> {
    const [filter, rest] = await this.readOf(where, options);
    return this.em().findOneOrFail(this.model(), filter, {
      ...rest,
      failHandler: () => NotFoundError.create(),
    });
  }

  /** Implements `Repository.count`, documented there; `DeletedReadOptions` count the rows a delete policy hides. */
  async count(where: Where<M> = {} as Where<M>, options?: DeletedReadOptions): Promise<number> {
    const [filter, rest] = await this.readOf<CountOptions<M>>(where, options);
    return rest === undefined
      ? this.em().count(this.model(), filter)
      : this.em().count(this.model(), filter, rest);
  }

  /** Implements `Repository.sum`, documented there. */
  sum(field: string, where: Where<M> = {} as Where<M>): Promise<number> {
    return this.aggregate((column) => `coalesce(sum(${column}), 0)`, field, where);
  }

  /** Implements `Repository.countDistinct`, documented there. */
  countDistinct(field: string, where: Where<M> = {} as Where<M>): Promise<number> {
    return this.aggregate((column) => `count(distinct ${column})`, field, where);
  }

  /**
   * Implements `Repository.lock`, documented there: exclusive (`for update`) unless `shared` (`for share`), and waiting
   * for a held row unless `nowait` (fail at once) or `skipLocked` (take the next free match, or null).
   *
   * @throws NotFoundError when no row matches, or none the caller may see (not with `skipLocked`, which returns null).
   * @throws TypeError when both `nowait` and `skipLocked` are given.
   * @throws ValidationError (MikroORM) when no transaction is running.
   */
  lock(where: Where<M>, options?: LockOptions & { readonly skipLocked?: false }): Promise<M>;

  /** Locks a matching row under any `options`; with `skipLocked` it returns null when every match is held. */
  lock(where: Where<M>, options: LockOptions): Promise<M | null>;

  /** Locks the matching row with the mode `options` picks; the overloads above document the contract. */
  lock(where: Where<M>, options: LockOptions = {}): Promise<M | null> {
    const { shared = false, nowait = false, skipLocked = false } = options;
    if (nowait && skipLocked)
      throw new TypeError("a lock either fails at once (nowait) or skips held rows (skipLocked)");
    const lockMode = skipLocked
      ? shared
        ? LockMode.PESSIMISTIC_PARTIAL_READ
        : LockMode.PESSIMISTIC_PARTIAL_WRITE
      : nowait
        ? shared
          ? LockMode.PESSIMISTIC_READ_OR_FAIL
          : LockMode.PESSIMISTIC_WRITE_OR_FAIL
        : shared
          ? LockMode.PESSIMISTIC_READ
          : LockMode.PESSIMISTIC_WRITE;
    // `refresh` so a row the unit of work loaded before the wait is read again as the lock holder left it.
    if (skipLocked) return this.findOne(where, { lockMode, refresh: true }) as Promise<M | null>;
    return this.findOneOrFail(where, { lockMode, refresh: true }) as Promise<M>;
  }

  /**
   * Implements `Repository.increment`, documented there.
   *
   * @throws TypeError when `by` is not a finite number or `field` is not a single-column field.
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   */
  increment(where: Where<M>, field: string, by = 1): Promise<number> {
    if (!Number.isFinite(by)) throw new TypeError(`increment takes a finite step, got ${by}`);
    this.refuseAppendOnly("increment");
    const em = this.em();
    const model = this.model();
    const column = quoteIdentifier(columnOf(em.getMetadata(model), field));
    // raw-sql: `col = col + ?` is the one atomic form; read-modify-write loses concurrent steps. The step is a parameter.
    return this.watched("updated", [field], filterOf(where), (filter) =>
      em.nativeUpdate(
        model,
        filter as never,
        {
          ...stampFields(model, "update"),
          ...nest(field, raw(`${column} + ?`, [by])),
        } as never,
      ),
    );
  }

  /**
   * Implements `Repository.create`, documented there.
   *
   * @throws SystemFieldWriteError when `data` sets a system field other than the id.
   */
  create(data: RequiredEntityData<M>): M {
    this.refuseSystemFields("create", data, CREATE_ALLOWED);
    return this.em().create(this.model(), data);
  }

  /**
   * Implements `Repository.insert`, documented there.
   *
   * @throws SystemFieldWriteError when `data` sets a system field other than the id.
   */
  insert(data: RequiredEntityData<M>, options: TransactionOptions = {}): Promise<M> {
    this.refuseSystemFields("insert", data, CREATE_ALLOWED);
    return this.writeNow(options, async (em) => {
      const row = em.create(this.model(), data);
      await em.flush();
      return row;
    });
  }

  /**
   * Implements `Repository.insertMany`, documented there: every row is created in the unit of work and flushed at once
   * in a savepoint (or its own transaction), so the ORM batches the insert statements and the flush subscribers stamp,
   * seal the encrypted fields and record each row's change, as for `insert`.
   *
   * @throws SystemFieldWriteError when a row sets a system field other than the id.
   */
  async insertMany(
    rows: readonly RequiredEntityData<M>[],
    options: TransactionOptions = {},
  ): Promise<M[]> {
    for (const row of rows) this.refuseSystemFields("insertMany", row, CREATE_ALLOWED);
    if (rows.length === 0) return [];
    return this.writeNow(options, async (em) => {
      const created = rows.map((data) => em.create(this.model(), data));
      await em.flush();
      return created;
    });
  }

  /**
   * Implements `Repository.upsert`, documented there. The stored rows are read by `by` in batches (soft-deleted and
   * archived ones too, which a unique index still covers), the matches are assigned and the rest created, and one flush
   * writes them in a savepoint (or its own transaction): the flush subscribers stamp, seal and record each change, and
   * a `Versioned` row raises its version. A row inserted by another transaction between the read and the flush fails
   * the flush with the unique violation (a retryable conflict for the caller).
   *
   * @throws TypeError when `by` is empty, a row lacks a `by` value, or two rows share one key.
   * @throws AppendOnlyWriteError for an `AppendOnly` model, whose rows are never changed.
   * @throws SystemFieldWriteError when a row sets a system field other than the id or a `by` field.
   */
  async upsert(
    rows: readonly RequiredEntityData<M>[],
    options: UpsertOptions,
  ): Promise<UpsertResult<M>> {
    const { by } = options;
    if (by.length === 0) throw new TypeError("upsert matches rows by at least one field");
    this.refuseAppendOnly("upsert");
    for (const row of rows) this.refuseSystemFields("upsert", row, [...CREATE_ALLOWED, ...by]);
    const keys = rows.map((row, index) => {
      const key = rowKey(row, by);
      if (key === undefined)
        throw new TypeError(`upsert row ${index} has no value for every field of ${by.join(", ")}`);
      return key;
    });
    if (new Set(keys).size !== keys.length)
      throw new TypeError(`upsert names one ${by.join(", ")} key twice`);
    if (rows.length === 0) return { rows: [], created: 0, updated: 0 };
    const model = this.model();
    return this.writeNow(options, async (em) => {
      const stored = new Map<string, M>();
      for (let start = 0; start < rows.length; start += BULK_LIMITS.batch) {
        const slice = rows.slice(start, start + BULK_LIMITS.batch);
        const found = await em.find(
          model,
          {
            $or: slice.map((row) =>
              Object.fromEntries(
                by.map((field) => [field, (row as Record<string, unknown>)[field]]),
              ),
            ),
          } as never,
          { filters: { deleted: false, archived: false } },
        );
        for (const row of found) stored.set(rowKey(row, by) ?? "", row as M);
      }
      let created = 0;
      const written = rows.map((data, index) => {
        const match = stored.get(keys[index] ?? "");
        if (match !== undefined) return em.assign(match, data as never) as M;
        created += 1;
        return em.create(model, data);
      });
      await em.flush();
      return { rows: written, created, updated: rows.length - created };
    });
  }

  /**
   * Implements `Repository.updateWhere`, documented there. One statement sets `data` and the stamps on every matching
   * row (raising `version` on a `Versioned` model) and reports the rows to the change feed. When `data` sets a field
   * the model encrypts, the rows are read in batches, assigned and flushed instead, so the encrypted-fields subscriber
   * seals the value: a native statement would store it in clear.
   *
   * @returns how many rows changed.
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   * @throws SystemFieldWriteError when `data` sets a system field.
   */
  async updateWhere(where: Where<M>, data: EntityData<M>): Promise<number> {
    this.refuseAppendOnly("updateWhere");
    this.refuseSystemFields("updateWhere", data);
    const fields = Object.keys(data);
    if (fields.length === 0) return 0;
    const model = this.model();
    const sealed = new Set(encryptedFieldsOf(model));
    if (fields.some((field) => sealed.has(field))) return this.updateEach(where, data);
    const em = this.em();
    const versioned = traitsOf(model).some((trait) => trait.name === "versioned");
    const version = versioned
      ? // raw-sql: `version = version + 1`, the optimistic lock's step, which a native statement must take itself
        { version: raw(`${quoteIdentifier(columnOf(em.getMetadata(model), "version"))} + 1`) }
      : {};
    return this.watched("updated", fields, filterOf(where), (filter) =>
      em.nativeUpdate(
        model,
        filter as never,
        { ...data, ...stampFields(model, "update"), ...version } as never,
      ),
    );
  }

  /**
   * Implements `Repository.deleteWhere`, documented there: `delete` by its policy, under the bulk verbs' name. Async,
   * so `delete`'s synchronous append-only refusal arrives as a rejection like the other bulk verbs'.
   */
  async deleteWhere(where: Where<M>): Promise<number> {
    return this.delete(where);
  }

  /**
   * Implements `Repository.chunk`, documented there: keyset reads by the primary key, each of `batch` rows, through
   * `find`, so visibility and the delete filters apply.
   *
   * @yields each batch of matching rows, in primary-key order; the last one may be short.
   * @throws TypeError when `batch` is not a whole number from 1 to 10,000, or the model has a composite primary key.
   */
  async *chunk(
    where: Where<M> = {} as Where<M>,
    options: EachOptions = {},
  ): AsyncGenerator<M[], void, undefined> {
    const { batch = BULK_LIMITS.batch, ...hidden } = options;
    if (!Number.isInteger(batch) || batch < 1 || batch > BULK_LIMITS.maxBatch)
      throw new TypeError(
        `a batch is a whole number from 1 to ${BULK_LIMITS.maxBatch}, got ${batch}`,
      );
    const keys = this.em().getMetadata(this.model()).primaryKeys;
    const [key] = keys;
    if (key === undefined || keys.length !== 1)
      throw new TypeError(`${this.model().name} has no single-column primary key to walk by`);
    let after: unknown;
    for (;;) {
      const page = (
        after === undefined ? where : { $and: [filterOf(where), { [key]: { $gt: after } }] }
      ) as Where<M>;
      const rows = (await this.find(page, {
        ...hidden,
        orderBy: { [key]: SortDirection.Asc },
        limit: batch,
      } as never)) as M[];
      if (rows.length === 0) return;
      yield rows;
      if (rows.length < batch) return;
      after = (rows.at(-1) as Record<string, unknown>)[key];
    }
  }

  /**
   * Implements `Repository.each`, documented there: the rows of `chunk`, one at a time.
   *
   * @yields each matching row, in primary-key order.
   */
  async *each(
    where: Where<M> = {} as Where<M>,
    options: EachOptions = {},
  ): AsyncGenerator<M, void, undefined> {
    for await (const rows of this.chunk(where, options)) yield* rows;
  }

  /**
   * Implements `Repository.page`, documented there.
   *
   * @throws TableFilterInvalidError when `page` is not a whole number from 1, `perPage` not one from 1 to 500, or the
   *         sort takes more than three keys.
   */
  async page<H extends string = never>(
    input: PageQuery,
    options: PageOptions<M, H> = {},
  ): Promise<OffsetPage<Loaded<M, H>>> {
    const { page, perPage } = input;
    if (!Number.isInteger(page) || page < 1)
      throw TableFilterInvalidError.create({
        key: "page",
        reason: "a page is a whole number from 1",
      });
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > BULK_LIMITS.maxPerPage)
      throw TableFilterInvalidError.create({
        key: "perPage",
        reason: `a page holds 1 to ${BULK_LIMITS.maxPerPage} rows`,
      });
    const { where = {} as Where<M>, populate, ...hidden } = options;
    const [filter, rest] = await this.readOf<FindOptions<M, H>>(where, {
      ...hidden,
      ...(populate === undefined ? {} : { populate }),
      orderBy: this.orderOf(input.sort),
      limit: perPage,
      offset: (page - 1) * perPage,
    });
    const [items, total] = await this.em().findAndCount(this.model(), filter, rest);
    return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
  }

  /**
   * See `Repository.purge`. With a `HoldRegistry` connected, it removes only the matching rows no legal hold covers
   * (the registry logs each held one, and is told each row's registered subject links) and counts only those; with
   * none, one statement removes every match.
   */
  async purge(where: Where<M>): Promise<number> {
    const em = this.em();
    const model = this.model();
    const filter = filterOf(where);
    // A purge reaches soft-deleted and archived rows too: it is how they finally go.
    const filters = { deleted: false, archived: false };
    if (HOLD_HOST.registry === undefined)
      return this.watched(
        "deleted",
        [],
        filter,
        (narrowed) => em.nativeDelete(model, narrowed as never, { filters }),
        filters,
      );
    const [key = "id"] = em.getMetadata(model).primaryKeys;
    const linkFields = HOLD_LINK_FIELDS.get(model) ?? [];
    const rows = (await em.find(model, filter, {
      fields: [key, ...linkFields] as never,
      filters,
    })) as Record<string, unknown>[];
    const ids = rows.map((row) => String(row[key]));
    const free = await disposableIds(model, ids, Disposal.Purge, holdLinksOf(model, rows, key));
    if (free.length === 0) return 0;
    // Only the checked ids, so a row inserted after the read is never removed unchecked.
    const removed = await em.nativeDelete(
      model,
      { $and: [filter, { [key]: { $in: free } }] } as never,
      {
        filters,
      },
    );
    await this.report({ em, model, kind: "deleted", ids: free, fields: [] });
    return removed;
  }

  /**
   * Deletes the rows matching `where` by the model's delete policy (ADR 0134 decision 4) and returns how many: a
   * `SoftDeletes` model sets `deletedAt`, an `Archivable` one `archivedAt` (both stamped, one statement, live rows
   * only), and any other model is hard-deleted through `purge`, so a legal hold still protects its rows.
   *
   * @throws AppendOnlyWriteError for an `AppendOnly` model, whose rows go only by `purge` (retention, erasure).
   */
  delete(where: Where<M>): Promise<number> {
    this.refuseAppendOnly("delete");
    const model = this.model();
    const policy = this.keptPolicy();
    if (policy === undefined) return this.purge(where);
    return this.watched("updated", [policy.field], filterOf(where), (filter) =>
      this.em().nativeUpdate(
        model,
        filter as never,
        {
          ...stampFields(model, "update"),
          [policy.field]: new Date(),
        } as never,
      ),
    );
  }

  /**
   * Brings back the soft-deleted (or archived) rows matching `where` and returns how many.
   *
   * @throws TypeError for a model whose delete policy keeps no row (neither `SoftDeletes` nor `Archivable`).
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   */
  restore(where: Where<M>): Promise<number> {
    this.refuseAppendOnly("restore");
    const model = this.model();
    const policy = this.keptPolicy();
    if (policy === undefined)
      throw new TypeError(`${model.name} is hard-deleted: there is nothing to restore`);
    const filters = { [policy.filter]: false };
    return this.watched(
      "updated",
      [policy.field],
      { $and: [filterOf(where), { [policy.field]: { $ne: null } }] },
      (filter) =>
        this.em().nativeUpdate(
          model,
          filter as never,
          { ...stampFields(model, "update"), [policy.field]: null } as never,
          { filters },
        ),
      filters,
    );
  }

  /** Removes the rows matching `where` for good, soft-deleted or archived ones included; a legal hold still applies. */
  forceDelete(where: Where<M>): Promise<number> {
    return this.purge(where);
  }

  /**
   * Changes the one row matching `where`; written when the caller's unit of work commits. With `requiresNew` it is read,
   * changed and written now in a transaction of its own that commits even if the caller's rolls back (an attempt
   * counter kept across a failed delivery), as `insert` does. With `expectedVersion` (a `Versioned` model), a row at
   * another version is refused before anything changes; the ORM's own version check at flush catches a change made
   * after this read, which the unit of work raises as the same refusal.
   *
   * @throws NotFoundError when no row matches.
   * @throws StaleVersionError when the row's version is not `expectedVersion`.
   * @throws AppendOnlyWriteError for an `AppendOnly` model, before anything is read.
   * @throws SystemFieldWriteError when `data` sets a system field (pass the version as `expectedVersion`).
   */
  async update(where: Where<M>, data: EntityData<M>, options: UpdateOptions = {}): Promise<M> {
    this.refuseAppendOnly("update");
    this.refuseSystemFields("update", data);
    if (options.requiresNew === true) {
      const model = this.model();
      const filter = await visibleFilter(model, where);
      return this.em().transactional(
        async (em) => {
          const row = await em.findOneOrFail(model, filter, {
            failHandler: () => NotFoundError.create(),
          });
          this.checkVersion(row, options.expectedVersion);
          em.assign(row as M, data as never);
          await em.flush();
          return row as M;
        },
        { propagation: TransactionPropagation.REQUIRES_NEW },
      );
    }
    const row = await this.findOneOrFail(where);
    this.checkVersion(row, options.expectedVersion);
    // reason: assign types its data as MikroORM's DTO union; EntityData<M> is what callers hold and assign takes
    this.em().assign(row as M, data as never);
    return row as M;
  }

  /**
   * Moves a scope subtree's rows: every row whose `scopePath` is `from` or below it takes `to` in place of that prefix
   * (`platform.a.shop` becomes `platform.b.shop` when `platform.a` moves to `platform.b`), in one statement inside the
   * caller's transaction, so the move commits whole or not at all. A service calls it from its listener of
   * `ScopeMoved` (`@stackra/scope/node`). The session's scope must reach both paths (a grant at a common ancestor):
   * row-level security hides the rows outside it and refuses a new path outside it. Rows the entity manager already
   * loaded keep their old path until they are read again.
   *
   * @returns the number of rows moved; 0 when `from` and `to` are the same path.
   * @throws TypeError when either path is not an `ltree` path, `to` lies below `from`, or the model has no
   *         single-column `scopePath`.
   * @throws AppendOnlyWriteError for an `AppendOnly` model.
   */
  async repath(from: string, to: string): Promise<number> {
    if (!LTREE_PATH.test(from) || !LTREE_PATH.test(to))
      throw new TypeError(`repath needs two ltree paths, got "${from}" and "${to}"`);
    if (to.startsWith(`${from}.`))
      throw new TypeError(`"${to}" lies below "${from}": a subtree cannot move under itself`);
    if (from === to) return 0;
    this.refuseAppendOnly("repath");
    const em = this.em();
    const model = this.model();
    const column = quoteIdentifier(columnOf(em.getMetadata(model), "scopePath"));
    // raw-sql: the ltree prefix rewrite (`<@`, `subpath`, `nlevel`) has no typed form; both paths are parameters
    return this.watched(
      "updated",
      ["scopePath"],
      filterOf({ $raw: raw(`${column} <@ ?::ltree`, [from]) } as Where<M>),
      (filter) =>
        em.nativeUpdate(
          model,
          filter as never,
          {
            ...stampFields(model, "update"),
            scopePath: raw(`?::ltree || subpath(${column}, nlevel(?::ltree))`, [to, from]),
          } as never,
        ),
    );
  }

  /**
   * One page of a resource table: the input's filters (each a `TableFilter`) and the caller's `where` applied, sorted by
   * the input's keys (up to three) then the primary key (so ties page stably), read by cursor. With `options.count` the
   * page also carries the matching rows' count (`Count.Estimated` caps it at 10,000, ADR 0307 rule 12).
   *
   * @throws TableFilterInvalidError for a filter value outside the `TableFilter` vocabulary, or more than three sort
   *         keys.
   */
  async table<H extends string = never>(
    input: TableQuery,
    options: TableOptions<M, H> = {},
  ): Promise<TablePage<Loaded<M, H>>> {
    const em = this.em();
    const model = this.model();
    const orderBy = this.orderOf(input.sort);
    const filters = Object.entries(input.filter ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([path, value]) => nest(path, filterCondition(path, value, options.period)));
    const visible = await visibleFilter(model, options.where ?? ({} as Where<M>));
    const where = { $and: [visible, ...filters] } as Where<M>;
    const cursor = await em.findByCursor(model, {
      where,
      orderBy,
      first: input.limit,
      ...(input.cursor === undefined ? {} : { after: input.cursor }),
      ...(options.populate === undefined ? {} : { populate: options.populate }),
      includeCount: false,
    });
    const next = cursor.hasNextPage ? cursor.endCursor : null;
    // After the page, not beside it: both statements share the call's connection.
    const count =
      options.count === undefined
        ? undefined
        : await tableCount(em, model, where as FilterQuery<M>, options.count);
    return {
      items: [...cursor.items] as Loaded<M, H>[],
      hasMore: cursor.hasNextPage,
      ...(next === null ? {} : { nextCursor: next }),
      ...(count === undefined ? {} : { count }),
    };
  }

  /**
   * The metrics of the rows matching `options.where` whose `options.on` falls in `period` or the period before; a series
   * buckets in `options.timeZone`, else the running call's time zone, else UTC.
   */
  metrics(period: Period, options: MetricsOptions<M>): MetricsReader<M> {
    const model = this.model();
    const zoned = { ...options, timeZone: options.timeZone ?? callTimeZone() };
    return new MetricsReader(this.em(), model, period, zoned, () =>
      visibleFilter(model, options.where ?? ({} as Where<M>)),
    );
  }

  /** The entity manager of the running context; a raw query in a subclass method goes through it (ADR 0160). */
  protected em(): EntityManager {
    return Database.current().em();
  }

  /** The model this service is typed against. */
  protected model(): AnyClass<M> {
    return modelOf<M>(this.constructor);
  }

  /**
   * The order of a table or page read: the sort's keys (up to three), then the primary key in the first key's direction
   * (newest first with no sort), so ties page stably.
   *
   * @throws TableFilterInvalidError for more than three sort keys.
   */
  private orderOf(
    sort: TableSort | readonly TableSort[] | undefined,
  ): NonNullable<FindOptions<M>["orderBy"]> {
    const [primary = "id"] = this.em().getMetadata(this.model()).primaryKeys;
    const sorts: readonly TableSort[] = sort === undefined ? [] : "key" in sort ? [sort] : sort;
    if (sorts.length > MAX_SORT_KEYS)
      throw TableFilterInvalidError.create({
        key: sorts.map((entry) => entry.key).join(","),
        reason: `a sort takes at most ${MAX_SORT_KEYS} keys`,
      });
    const direction = sorts[0]?.direction ?? SortDirection.Desc;
    return [
      ...sorts.map((entry) => nest(entry.key, entry.direction)),
      ...(sorts.some((entry) => entry.key === primary) ? [] : [{ [primary]: direction }]),
    ] as NonNullable<FindOptions<M>["orderBy"]>;
  }

  /** Runs `work` now on its own entity manager: in a savepoint of the caller's transaction, or one of its own. */
  private writeNow<T>(
    options: Pick<TransactionOptions, "requiresNew">,
    work: (em: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.em().transactional((em) => work(em as EntityManager), {
      propagation:
        options.requiresNew === true
          ? TransactionPropagation.REQUIRES_NEW
          : TransactionPropagation.NESTED,
    });
  }

  /**
   * `updateWhere` through the unit of work, for data that sets an encrypted field: each batch of matching rows is
   * assigned and flushed, so the flush subscribers seal, stamp and record it.
   */
  private async updateEach(where: Where<M>, data: EntityData<M>): Promise<number> {
    let changed = 0;
    for await (const rows of this.chunk(where)) {
      const em = this.em();
      for (const row of rows) em.assign(row, data as never);
      await em.flush();
      changed += rows.length;
    }
    return changed;
  }

  /**
   * Refuses `row` when the caller expected another version.
   *
   * @throws StaleVersionError when `expected` is given and the row's `version` differs.
   */
  private checkVersion(row: object, expected: number | undefined): void {
    if (expected === undefined) return;
    if ((row as { version?: unknown }).version !== expected)
      throw StaleVersionError.create({ model: this.model().name });
  }

  /**
   * Refuses `operation` on an `AppendOnly` model, whose rows are inserted and never changed.
   *
   * @throws AppendOnlyWriteError when the model is `AppendOnly`.
   */
  private refuseAppendOnly(operation: string): void {
    const model = this.model();
    if (isAppendOnly(model)) throw AppendOnlyWriteError.create({ model: model.name, operation });
  }

  /**
   * Refuses `operation` when `data` sets one of the model's system fields (`SYSTEM_FIELDS` of its traits) outside
   * `allowed`.
   *
   * @throws SystemFieldWriteError naming the first such field.
   */
  private refuseSystemFields(
    operation: string,
    data: object,
    allowed: readonly string[] = [],
  ): void {
    const model = this.model();
    const given = new Set(Object.keys(data));
    const field = systemFieldsOf(model).find((name) => given.has(name) && !allowed.includes(name));
    if (field !== undefined)
      throw SystemFieldWriteError.create({ model: model.name, field, operation });
  }

  /** The keep-the-row policy of the model: its filter and field, or `undefined` for a hard delete. */
  private keptPolicy(): { readonly filter: string; readonly field: string } | undefined {
    const names = new Set(traitsOf(this.model()).map((trait) => trait.name));
    // SoftDeletes wins when a model has both: a delete is the shorter-lived one.
    for (const [filter, { trait, field }] of Object.entries(DELETE_FILTERS))
      if (names.has(trait)) return { filter, field };
    return undefined;
  }

  /** The filter and the ORM options of a read, with the delete filters a `DeletedReadOptions` turns off. */
  private async readOf<O extends { readonly filters?: unknown }>(
    where: Where<M>,
    options: (O & DeletedReadOptions) | undefined,
  ): Promise<[FilterQuery<M>, O | undefined]> {
    const visible = await visibleFilter(this.model(), where);
    if (options === undefined) return [visible, undefined];
    const { withDeleted, onlyDeleted, withArchived, onlyArchived, ...rest } = options;
    const off: Record<string, false> = {};
    const only: object[] = [];
    for (const [name, include, alone] of [
      ["deleted", withDeleted, onlyDeleted],
      ["archived", withArchived, onlyArchived],
    ] as const) {
      if (include !== true && alone !== true) continue;
      off[name] = false;
      if (alone === true) only.push({ [DELETE_FILTERS[name].field]: { $ne: null } });
    }
    if (Object.keys(off).length === 0) return [visible, rest as unknown as O];
    const held = rest.filters;
    const filters =
      held === false
        ? false
        : typeof held === "object" && held !== null && !Array.isArray(held)
          ? { ...held, ...off }
          : off;
    return [
      (only.length === 0 ? visible : { $and: [visible, ...only] }) as FilterQuery<M>,
      { ...rest, filters } as unknown as O,
    ];
  }

  /** One aggregate of `field`'s column over the visible rows matching `where`, as a number (0 for no row). */
  private async aggregate(
    expression: (column: string) => string,
    field: string,
    where: Where<M>,
  ): Promise<number> {
    const em = this.em();
    const model = this.model();
    const column = `row.${quoteIdentifier(columnOf(em.getMetadata(model), field))}`;
    const row = (await em
      .createQueryBuilder(model, "row")
      .select(raw(`${expression(column)} as total`))
      .where((await visibleFilter(model, where)) as QBFilterQuery<M>)
      .execute("get")) as Record<string, unknown> | undefined;
    return Number(row?.["total"] ?? 0);
  }

  /** Runs a native write of this service's model through `watchedNativeWrite`. */
  private watched(
    kind: NativeWrite["kind"],
    fields: readonly string[],
    filter: object,
    write: (filter: object) => Promise<number>,
    filters?: Readonly<Record<string, boolean>>,
  ): Promise<number> {
    return watchedNativeWrite(
      {
        em: this.em(),
        model: this.model(),
        kind,
        fields,
        filter,
        ...(filters === undefined ? {} : { filters }),
      },
      write,
    );
  }

  /** Reports a native write whose ids are already known to the connected watcher, when it watches the model. */
  private async report(write: NativeWrite): Promise<void> {
    const watcher = NATIVE_WRITE_HOST.watcher;
    if (write.ids.length > 0 && watcher?.watches(write.model) === true)
      await watcher.written(write);
  }
}
