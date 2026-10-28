/**
 * Stackra file contract:
 * Purpose: `CrudService<M>`, the kind base of a module service over one model: `class OrderService extends
 *          CrudService<Order>` inherits the repository reads and writes, `update`, the table read of a resource
 *          (`table(input, { where, period })`, with range, date-range, comparison, contains and null filters and a
 *          multi-key sort) and the metrics of a KPI (`metrics(period, { on })`).
 * Boundary: a service (it extends container's `Service`, so its binding kind is `service`); its own constructor
 *           dependencies are the subclass's, and it calls `super()` with none. The model comes from the type argument,
 *           which gen registers; the entity manager is the running context's, so every method runs inside the
 *           caller's transaction (an action's unit of work) and a query reads on a fork. A hand-written method of the
 *           same name overrides an inherited one. Every read (`find`, `findOne`, `findOneOrFail`, `count`, `sum`,
 *           `countDistinct`, `table`, `metrics`, and `lock`, which also takes a row lock) ANDs in the bound
 *           `VisibilityFilter`'s conditions, on top of row-level security; writes (`increment` among them) and `purge`
 *           carry none. `update` takes the caller's `expectedVersion`. Database errors stay the
 *           driver's here (a caller may catch `UniqueViolation`); the action's unit of work raises them as refusals.
 *           Native updates (`increment`, `repath`) set the
 *           `Timestamps`/`UserStamps` fields themselves, since no entity event fires for them. Deletes follow the model's delete policy (ADR 0134 d4): `delete` soft-deletes
 *           or archives a `SoftDeletes`/`Archivable` model's rows and hard-deletes any other's, `restore` brings kept
 *           rows back, `forceDelete` and `purge` remove them for good; the drivers' `deleted`/`archived` filters hide
 *           kept rows from every read unless `DeletedReadOptions` asks for them. `purge` skips every row the connected `HoldRegistry` holds. `repath` moves
 *           a scope subtree's rows to a new path prefix, the step every service takes when a scope node moves.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0097 (decision 5.3); ADR 0307 (rules 2 and 16);
 *                     ADR 0305 (rule 5: partner by type argument); ADR 0136 (decision 2); ADR 0333 (decision 4);
 *                     ADR 0134 (2026-10-24 amendment: legal holds); ADR 0411 (subtree move); STA-1239 (row lock,
 *                     atomic increment, `update` with `requiresNew`); reporting gap 5 (filter operators, multi-key sort);
 *                     data-layer gaps mo5 and mo6 (`expectedVersion`, database errors as refusals).
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
import { traitsOf } from "@stackra/model";

import { DELETE_FILTERS } from "#core/constants/delete-filters.constant";
import { TableFilterInvalidError } from "#core/errors/table-filter-invalid.error";
import { HOLD_HOST } from "#core/constants/hold-host.constant";
import { HOLD_LINK_FIELDS } from "#core/constants/hold-link-fields.constant";
import { LTREE_PATH } from "#core/constants/ltree-path.constant";
import { columnOf } from "#core/functions/column-of.function";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { filterCondition } from "#core/functions/filter-condition.function";
import { filterOf } from "#core/functions/filter-of.function";
import { holdLinksOf } from "#core/functions/hold-links-of.function";
import { modelOf } from "#core/functions/model-of.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { stampFields } from "#core/functions/stamp-fields.function";
import { StaleVersionError } from "#core/errors/stale-version.error";
import { visibleFilter } from "#core/functions/visible-filter.function";
import { Database } from "#core/ports/database.port";
import type { MetricsOptions } from "#core/types/metrics-options.type";
import type { Repository } from "#core/types/repository.type";
import type { TableOptions } from "#core/types/table-options.type";
import type { TablePage } from "#core/types/table-page.type";
import type { TableQuery } from "#core/types/table-query.type";
import type { DeletedReadOptions } from "#core/types/deleted-read-options.type";
import type { TableSort } from "#core/types/table-sort.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import type { UpdateOptions } from "#core/types/update-options.type";
import { Disposal } from "#contracts/enums/disposal.enum";
import type { Where } from "#contracts/types/where.type";
import { MetricsReader } from "#core/values/metrics-reader.value";

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
   * Implements `Repository.lock`, documented there.
   *
   * @throws NotFoundError when no row matches, or none the caller may see.
   * @throws ValidationError (MikroORM) when no transaction is running.
   */
  lock(where: Where<M>): Promise<M> {
    // `refresh` so a row the unit of work loaded before the wait is read again as the lock holder left it.
    return this.findOneOrFail(where, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
      refresh: true,
    }) as Promise<M>;
  }

  /**
   * Implements `Repository.increment`, documented there.
   *
   * @throws TypeError when `by` is not a finite number or `field` is not a single-column field.
   */
  increment(where: Where<M>, field: string, by = 1): Promise<number> {
    if (!Number.isFinite(by)) throw new TypeError(`increment takes a finite step, got ${by}`);
    const em = this.em();
    const model = this.model();
    const column = quoteIdentifier(columnOf(em.getMetadata(model), field));
    // raw-sql: `col = col + ?` is the one atomic form; read-modify-write loses concurrent steps. The step is a parameter.
    return em.nativeUpdate(model, filterOf(where), {
      ...stampFields(model, "update"),
      ...nest(field, raw(`${column} + ?`, [by])),
    } as never);
  }

  /** Implements `Repository.create`, documented there. */
  create(data: RequiredEntityData<M>): M {
    return this.em().create(this.model(), data);
  }

  /** Implements `Repository.insert`, documented there. */
  insert(data: RequiredEntityData<M>, options: TransactionOptions = {}): Promise<M> {
    return this.em().transactional(
      async (em) => {
        const row = em.create(this.model(), data);
        await em.flush();
        return row;
      },
      {
        propagation:
          options.requiresNew === true
            ? TransactionPropagation.REQUIRES_NEW
            : TransactionPropagation.NESTED,
      },
    );
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
    if (HOLD_HOST.registry === undefined) return em.nativeDelete(model, filter, { filters });
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
    return em.nativeDelete(model, { $and: [filter, { [key]: { $in: free } }] } as never, {
      filters,
    });
  }

  /**
   * Deletes the rows matching `where` by the model's delete policy (ADR 0134 decision 4) and returns how many: a
   * `SoftDeletes` model sets `deletedAt`, an `Archivable` one `archivedAt` (both stamped, one statement, live rows
   * only), and any other model is hard-deleted through `purge`, so a legal hold still protects its rows.
   */
  delete(where: Where<M>): Promise<number> {
    const model = this.model();
    const policy = this.keptPolicy();
    if (policy === undefined) return this.purge(where);
    return this.em().nativeUpdate(model, filterOf(where), {
      ...stampFields(model, "update"),
      [policy.field]: new Date(),
    } as never);
  }

  /**
   * Brings back the soft-deleted (or archived) rows matching `where` and returns how many.
   *
   * @throws TypeError for a model whose delete policy keeps no row (neither `SoftDeletes` nor `Archivable`).
   */
  restore(where: Where<M>): Promise<number> {
    const model = this.model();
    const policy = this.keptPolicy();
    if (policy === undefined)
      throw new TypeError(`${model.name} is hard-deleted: there is nothing to restore`);
    return this.em().nativeUpdate(
      model,
      { $and: [filterOf(where), { [policy.field]: { $ne: null } }] } as never,
      { ...stampFields(model, "update"), [policy.field]: null } as never,
      { filters: { [policy.filter]: false } },
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
   */
  async update(where: Where<M>, data: EntityData<M>, options: UpdateOptions = {}): Promise<M> {
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
   */
  async repath(from: string, to: string): Promise<number> {
    if (!LTREE_PATH.test(from) || !LTREE_PATH.test(to))
      throw new TypeError(`repath needs two ltree paths, got "${from}" and "${to}"`);
    if (to.startsWith(`${from}.`))
      throw new TypeError(`"${to}" lies below "${from}": a subtree cannot move under itself`);
    if (from === to) return 0;
    const em = this.em();
    const model = this.model();
    const column = quoteIdentifier(columnOf(em.getMetadata(model), "scopePath"));
    // raw-sql: the ltree prefix rewrite (`<@`, `subpath`, `nlevel`) has no typed form; both paths are parameters
    return em.nativeUpdate(
      model,
      filterOf({ $raw: raw(`${column} <@ ?::ltree`, [from]) } as Where<M>),
      {
        ...stampFields(model, "update"),
        scopePath: raw(`?::ltree || subpath(${column}, nlevel(?::ltree))`, [to, from]),
      } as never,
    );
  }

  /**
   * One page of a resource table: the input's filters (each a `TableFilter`) and the caller's `where` applied, sorted by
   * the input's keys (up to three) then the primary key (so ties page stably), read by cursor.
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
    const [primary = "id"] = em.getMetadata(model).primaryKeys;
    const sorts: readonly TableSort[] =
      input.sort === undefined ? [] : "key" in input.sort ? [input.sort] : input.sort;
    if (sorts.length > MAX_SORT_KEYS)
      throw TableFilterInvalidError.create({
        key: sorts.map((sort) => sort.key).join(","),
        reason: `a sort takes at most ${MAX_SORT_KEYS} keys`,
      });
    const direction = sorts[0]?.direction ?? SortDirection.Desc;
    const filters = Object.entries(input.filter ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([path, value]) => nest(path, filterCondition(path, value, options.period)));
    const visible = await visibleFilter(model, options.where ?? ({} as Where<M>));
    const cursor = await em.findByCursor(model, {
      where: { $and: [visible, ...filters] } as Where<M>,
      orderBy: [
        ...sorts.map((sort) => nest(sort.key, sort.direction)),
        ...(sorts.some((sort) => sort.key === primary) ? [] : [{ [primary]: direction }]),
      ] as NonNullable<FindOptions<M>["orderBy"]>,
      first: input.limit,
      ...(input.cursor === undefined ? {} : { after: input.cursor }),
      ...(options.populate === undefined ? {} : { populate: options.populate }),
      includeCount: false,
    });
    const next = cursor.hasNextPage ? cursor.endCursor : null;
    return {
      items: [...cursor.items] as Loaded<M, H>[],
      hasMore: cursor.hasNextPage,
      ...(next === null ? {} : { nextCursor: next }),
    };
  }

  /** The metrics of the rows matching `options.where` whose `options.on` falls in `period` or the period before. */
  metrics(period: Period, options: MetricsOptions<M>): MetricsReader<M> {
    const model = this.model();
    return new MetricsReader(this.em(), model, period, options, () =>
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
   * Refuses `row` when the caller expected another version.
   *
   * @throws StaleVersionError when `expected` is given and the row's `version` differs.
   */
  private checkVersion(row: object, expected: number | undefined): void {
    if (expected === undefined) return;
    if ((row as { version?: unknown }).version !== expected)
      throw StaleVersionError.create({ model: this.model().name });
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
}
