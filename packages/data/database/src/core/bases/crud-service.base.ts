/**
 * Stackra file contract:
 * Purpose: `CrudService<M>`, the kind base of a module service over one model: `class OrderService extends
 *          CrudService<Order>` inherits the repository reads and writes, `update`, the table read of a resource
 *          (`table(input, { where })`) and the metrics of a KPI (`metrics(period, { on })`).
 * Boundary: a service (it extends container's `Service`, so its binding kind is `service`); its own constructor
 *           dependencies are the subclass's, and it calls `super()` with none. The model comes from the type argument,
 *           which gen registers; the entity manager is the running context's, so every method runs inside the
 *           caller's transaction (an action's unit of work) and a query reads on a fork. A hand-written method of the
 *           same name overrides an inherited one.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0097 (decision 5.3); ADR 0307 (rules 2 and 16);
 *                     ADR 0305 (rule 5: partner by type argument); ADR 0136 (decision 2).
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

import { columnOf } from "#core/functions/column-of.function";
import { filterOf } from "#core/functions/filter-of.function";
import { modelOf } from "#core/functions/model-of.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { Database } from "#core/ports/database.port";
import type { MetricsOptions } from "#core/types/metrics-options.type";
import type { Repository } from "#core/types/repository.type";
import type { TableOptions } from "#core/types/table-options.type";
import type { TablePage } from "#core/types/table-page.type";
import type { TableQuery } from "#core/types/table-query.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import type { Where } from "#core/types/where.type";
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
  find<H extends string = never>(
    where: Where<M>,
    options?: FindOptions<M, H>,
  ): Promise<Loaded<M, H>[]> {
    return this.em().find(this.model(), filterOf(where), options);
  }

  /** See `Repository.findOne`. */
  findOne<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ): Promise<Loaded<M, H> | null> {
    return this.em().findOne(this.model(), filterOf(where), options);
  }

  /**
   * See `Repository.findOneOrFail`.
   *
   * @throws NotFoundError when no row matches.
   */
  findOneOrFail<H extends string = never>(
    where: Where<M>,
    options?: FindOneOptions<M, H>,
  ): Promise<Loaded<M, H>> {
    return this.em().findOneOrFail(this.model(), filterOf(where), {
      ...options,
      failHandler: () => NotFoundError.create(),
    });
  }

  /** See `Repository.count`. */
  count(where: Where<M> = {} as Where<M>): Promise<number> {
    return this.em().count(this.model(), filterOf(where));
  }

  /** See `Repository.sum`. */
  async sum(field: string, where: Where<M> = {} as Where<M>): Promise<number> {
    const em = this.em();
    const column = quoteIdentifier(columnOf(em.getMetadata(this.model()), field));
    const row = (await em
      .createQueryBuilder(this.model(), "row")
      .select(raw(`coalesce(sum(row.${column}), 0) as total`))
      .where(filterOf(where) as QBFilterQuery<M>)
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

  /** See `Repository.purge`. */
  purge(where: Where<M>): Promise<number> {
    return this.em().nativeDelete(this.model(), filterOf(where));
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
   * One page of a resource table: the input's filters and the caller's `where` applied, sorted by the input's key
   * then the primary key (so ties page stably), read by cursor.
   */
  async table<H extends string = never>(
    input: TableQuery,
    options: TableOptions<M, H> = {},
  ): Promise<TablePage<Loaded<M, H>>> {
    const em = this.em();
    const [primary = "id"] = em.getMetadata(this.model()).primaryKeys;
    const direction = input.sort?.direction ?? SortDirection.Desc;
    const filters = Object.entries(input.filter ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([path, value]) => nest(path, Array.isArray(value) ? { $in: value } : value));
    const cursor = await em.findByCursor(this.model(), {
      where: { $and: [filterOf(options.where ?? ({} as Where<M>)), ...filters] } as Where<M>,
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
    return new MetricsReader(this.em(), this.model(), period, options);
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
