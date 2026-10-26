/**
 * Stackra file contract:
 * Purpose: `CrudService<M>`, the kind base of a module service over one model: `class OrderService extends
 *          CrudService<Order>` inherits the repository reads and writes, `update`, the table read of a resource
 *          (`table(input, { where })`) and the metrics of a KPI (`metrics(period, { on })`).
 * Boundary: a service (it extends container's `Service`, so its binding kind is `service`); its own constructor
 *           dependencies are the subclass's, and it calls `super()` with none. The model comes from the type argument,
 *           which gen registers; the entity manager is the running context's, so every method runs inside the
 *           caller's transaction (an action's unit of work) and a query reads on a fork. A hand-written method of the
 *           same name overrides an inherited one. Every read (`find`, `findOne`, `findOneOrFail`, `count`, `sum`,
 *           `table`, `metrics`) ANDs in the bound `VisibilityFilter`'s conditions, on top of row-level security;
 *           writes and `purge` carry none. `purge` skips every row the connected `HoldRegistry` holds. `repath` moves
 *           a scope subtree's rows to a new path prefix, the step every service takes when a scope node moves.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0097 (decision 5.3); ADR 0307 (rules 2 and 16);
 *                     ADR 0305 (rule 5: partner by type argument); ADR 0136 (decision 2); ADR 0333 (decision 4);
 *                     ADR 0134 (2026-10-24 amendment: legal holds); ADR 0411 (subtree move).
 */
import { TransactionPropagation, raw } from "@mikro-orm/core";
import type {
  EntityData,
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

import { HOLD_HOST } from "#core/constants/hold-host.constant";
import { LTREE_PATH } from "#core/constants/ltree-path.constant";
import { columnOf } from "#core/functions/column-of.function";
import { disposableIds } from "#core/functions/disposable-ids.function";
import { filterOf } from "#core/functions/filter-of.function";
import { modelOf } from "#core/functions/model-of.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { visibleFilter } from "#core/functions/visible-filter.function";
import { Database } from "#core/ports/database.port";
import type { MetricsOptions } from "#core/types/metrics-options.type";
import type { Repository } from "#core/types/repository.type";
import type { TableOptions } from "#core/types/table-options.type";
import type { TablePage } from "#core/types/table-page.type";
import type { TableQuery } from "#core/types/table-query.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import { Disposal } from "#contracts/enums/disposal.enum";
import type { Where } from "#contracts/types/where.type";
import { MetricsReader } from "#core/values/metrics-reader.value";

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
  /** See `Repository.find`. */
  async find<H extends string = never>(
    where: Where<M>,
    options?: FindOptions<M, H>,
  ): Promise<Loaded<M, H>[]> {
    const model = this.model();
    return this.em().find(model, await visibleFilter(model, where), options);
  }

  /** See `Repository.findOne`. */
  async findOne<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ): Promise<Loaded<M, H> | null> {
    const model = this.model();
    return this.em().findOne(model, await visibleFilter(model, where), options);
  }

  /**
   * See `Repository.findOneOrFail`.
   *
   * @throws NotFoundError when no row matches, or none the caller may see.
   */
  async findOneOrFail<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ): Promise<Loaded<M, H>> {
    const model = this.model();
    return this.em().findOneOrFail(model, await visibleFilter(model, where), {
      ...options,
      failHandler: () => NotFoundError.create(),
    });
  }

  /** See `Repository.count`. */
  async count(where: Where<M> = {} as Where<M>): Promise<number> {
    const model = this.model();
    return this.em().count(model, await visibleFilter(model, where));
  }

  /** See `Repository.sum`. */
  async sum(field: string, where: Where<M> = {} as Where<M>): Promise<number> {
    const em = this.em();
    const model = this.model();
    const column = quoteIdentifier(columnOf(em.getMetadata(model), field));
    const row = (await em
      .createQueryBuilder(model, "row")
      .select(raw(`coalesce(sum(row.${column}), 0) as total`))
      .where((await visibleFilter(model, where)) as QBFilterQuery<M>)
      .execute("get")) as Record<string, unknown> | undefined;
    return Number(row?.["total"] ?? 0);
  }

  /** See `Repository.create`. */
  create(data: RequiredEntityData<M>): M {
    return this.em().create(this.model(), data);
  }

  /** See `Repository.insert`. */
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
   * (the registry logs each held one) and counts only those; with none, one statement removes every match.
   */
  async purge(where: Where<M>): Promise<number> {
    const em = this.em();
    const model = this.model();
    const filter = filterOf(where);
    if (HOLD_HOST.registry === undefined) return em.nativeDelete(model, filter);
    const [key = "id"] = em.getMetadata(model).primaryKeys;
    const rows = (await em.find(model, filter, { fields: [key] as never })) as Record<
      string,
      unknown
    >[];
    const ids = rows.map((row) => String(row[key]));
    const free = await disposableIds(model, ids, Disposal.Purge);
    if (free.length === 0) return 0;
    // Only the checked ids, so a row inserted after the read is never removed unchecked.
    return em.nativeDelete(model, { $and: [filter, { [key]: { $in: free } }] } as never);
  }

  /**
   * Changes the one row matching `where`; written when the caller's unit of work commits.
   *
   * @throws NotFoundError when no row matches.
   */
  async update(where: Where<M>, data: EntityData<M>): Promise<M> {
    const row = await this.findOneOrFail(where);
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
      { scopePath: raw(`?::ltree || subpath(${column}, nlevel(?::ltree))`, [to, from]) } as never,
    );
  }

  /**
   * One page of a resource table: the input's filters and the caller's `where` applied, sorted by the input's key
   * then the primary key (so ties page stably), read by cursor.
   */
  async table<H extends string = never>(
    input: TableQuery,
    options: TableOptions<M, H> = {},
  ): Promise<TablePage<Loaded<M, H>>> {
    const em = this.em();
    const model = this.model();
    const [primary = "id"] = em.getMetadata(model).primaryKeys;
    const direction = input.sort?.direction ?? SortDirection.Desc;
    const filters = Object.entries(input.filter ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([path, value]) => nest(path, Array.isArray(value) ? { $in: value } : value));
    const visible = await visibleFilter(model, options.where ?? ({} as Where<M>));
    const cursor = await em.findByCursor(model, {
      where: { $and: [visible, ...filters] } as Where<M>,
      orderBy: [
        ...(input.sort === undefined ? [] : [nest(input.sort.key, direction)]),
        { [primary]: direction },
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
}
