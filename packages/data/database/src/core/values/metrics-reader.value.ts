/**
 * Stackra file contract:
 * Purpose: `MetricsReader`, what `CrudService.metrics(period, { on, where, timeZone })` returns: a count, sum,
 *          average, minimum, maximum or distinct count over the period and the period before it, its series by hour,
 *          day, week, month or quarter, and its breakdown by a dimension, each in one statement.
 * Boundary: reads only, through the ORM's query builder so `where` is the typed filter; field paths resolve through
 *           the generated metadata, never as written, and the grain and time zone are parameters. A money aggregate
 *           (`<field>.minor`) refuses rows in two currencies. A series buckets by the calendar in the reader's time
 *           zone (`date_trunc` on the local wall clock), so a day across a daylight-saving change is one local day.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 15 and 16); ADR 0160 (parameterised SQL); ADR 0136 (decision 1); reporting
 *                     gap 10.
 */
import { raw } from "@mikro-orm/core";
import type { EntityMetadata, FilterQuery } from "@mikro-orm/core";
import type { EntityManager, QBFilterQuery } from "@mikro-orm/postgresql";
import type { Period } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

import { Aggregate } from "#core/enums/aggregate.enum";
import { MetricGrain } from "#core/enums/metric-grain.enum";
import { MixedCurrencyError } from "#core/errors/mixed-currency.error";
import { columnOf } from "#core/functions/column-of.function";
import { filterOf } from "#core/functions/filter-of.function";
import { metricBuckets } from "#core/functions/metric-buckets.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { MetricBreakdown } from "#core/types/metric-breakdown.type";
import type { MetricSeries } from "#core/types/metric-series.type";
import type { MetricValue } from "#core/types/metric-value.type";
import type { MetricsOptions } from "#core/types/metrics-options.type";

/** The query alias the raw expressions name. */
const ALIAS = "row";

/** The aggregates a money amount refuses over two currencies. */
const MONEY: ReadonlySet<Aggregate> = new Set([
  Aggregate.Sum,
  Aggregate.Avg,
  Aggregate.Min,
  Aggregate.Max,
]);

/** The `filter` clause of an aggregate over `window`; none for a grouped read. */
const filtered = (window: string | undefined): string =>
  window === undefined ? "" : ` filter (where ${window})`;

/** The aggregate SQL of one metric, with the window condition it is filtered by (none for a grouped read). */
type Expression = (window?: string) => string;

/**
 * Metrics of `M` over one period.
 *
 * @example
 * const paid = orders.metrics(period, { on: "paidAt", where: { status: OrderStatus.Paid }, timeZone: ctx.timeZone });
 * const [revenue, average, weekly] = await Promise.all([
 *   paid.sum("total.minor"),
 *   paid.value(Aggregate.Avg, "total.minor"),
 *   paid.series(Aggregate.Count, undefined, MetricGrain.Week),
 * ]);
 */
export class MetricsReader<M extends object> {
  /** The entity manager the reads run on. */
  private readonly em: EntityManager;

  /** The model. */
  private readonly model: AnyClass<M>;

  /** The model's metadata. */
  private readonly meta: EntityMetadata;

  /** The period. */
  private readonly period: Period;

  /** The options. */
  private readonly options: MetricsOptions<M>;

  /** The filter of the rows that count, read when a statement runs. */
  private readonly filter: () => Promise<FilterQuery<M>>;

  /**
   * @param em - the entity manager of the call.
   * @param model - the model to aggregate.
   * @param period - the period and its previous period.
   * @param options - the instant field, the rows that count and the time zone (UTC when absent).
   * @param filter - the filter of the rows that count; `options.where` as written by default, and
   *        `CrudService.metrics` passes it with the visibility conditions ANDed in.
   * @throws TypeError when `options.on` is not a single-column field.
   */
  constructor(
    em: EntityManager,
    model: AnyClass<M>,
    period: Period,
    options: MetricsOptions<M>,
    filter: () => Promise<FilterQuery<M>> = async () => filterOf(options.where ?? {}),
  ) {
    this.em = em;
    this.model = model;
    this.meta = em.getMetadata(model);
    this.period = period;
    this.options = options;
    this.filter = filter;
    this.column(options.on);
  }

  /** How many rows fall in the period and in the previous one. */
  count(): Promise<MetricValue> {
    return this.value(Aggregate.Count);
  }

  /**
   * The sum of `path` over the period and the previous one.
   *
   * @throws MixedCurrencyError when `path` is a money amount (`<field>.minor`) and the rows hold two currencies.
   * @throws TypeError when `path` is not a single-column field.
   */
  sum(path: string): Promise<MetricValue> {
    return this.value(Aggregate.Sum, path);
  }

  /**
   * `aggregate` of `path` over the period and the previous one.
   *
   * @param aggregate - any `Aggregate`; every one but `Aggregate.Count` needs `path`.
   * @throws MixedCurrencyError for a sum, average, minimum or maximum of a money amount over two currencies.
   * @throws TypeError for an aggregate without its path, or a path that is not a single-column field.
   */
  async value(aggregate: Aggregate, path?: string): Promise<MetricValue> {
    const expression = this.expression(aggregate, path);
    const on = this.column(this.options.on);
    const window = `${on} >= cast(? as timestamptz) and ${on} < cast(? as timestamptz)`;
    const { from, to, previous } = this.period;
    const row = ((await (
      await this.base()
    )
      .select([
        raw(`${expression(window)} as current`, [from, to]),
        raw(`${expression(window)} as previous`, [previous.from, previous.to]),
        ...this.currencies(aggregate, path),
      ])
      .execute("get")) ?? {}) as Record<string, unknown>;
    this.refuseMixed([row], path);
    return { current: Number(row["current"]), previous: Number(row["previous"]) };
  }

  /**
   * One value per bucket of the period and of the previous period, bucketed in the reader's time zone.
   *
   * @param aggregate - any `Aggregate`; every one but `Aggregate.Count` needs `path`.
   * @param grain - the bucket; a day by default.
   * @throws MixedCurrencyError when one bucket's money rows hold two currencies.
   * @throws TypeError for an aggregate without its path, or a path that is not a single-column field.
   * @throws RangeError for an unknown time zone, or a series of more than 5,000 buckets.
   */
  async series(
    aggregate: Aggregate,
    path?: string,
    grain: MetricGrain = MetricGrain.Day,
  ): Promise<MetricSeries> {
    const expression = this.expression(aggregate, path);
    const timeZone = this.options.timeZone ?? "UTC";
    const { from, to, previous } = this.period;
    const keys = {
      current: metricBuckets(from, to, grain, timeZone),
      previous: metricBuckets(previous.from, previous.to, grain, timeZone),
    };
    const on = this.column(this.options.on);
    const rows = (await (
      await this.base()
    )
      .select([
        raw(`${on} >= cast(? as timestamptz) as is_current`, [from]),
        raw(`to_char(date_trunc(?, ${on} at time zone ?), 'YYYY-MM-DD HH24:MI') as bucket`, [
          grain,
          timeZone,
        ]),
        raw(`${expression()} as value`),
        ...this.currencies(aggregate, path),
      ])
      .groupBy([raw("1"), raw("2")])
      .execute("all")) as readonly Record<string, unknown>[];
    this.refuseMixed(rows, path);
    const series = {
      current: keys.current.map(() => 0),
      previous: keys.previous.map(() => 0),
    };
    for (const row of rows) {
      const period = row["is_current"] === true ? "current" : "previous";
      const index = keys[period].indexOf(String(row["bucket"]));
      if (index !== -1) series[period][index] = Number(row["value"]);
    }
    return series;
  }

  /**
   * `aggregate` of `path` for each value of `dimension`, over the period and the previous one, largest current
   * value first.
   *
   * @param dimension - the single-column field to group by (`channel`, `status`).
   * @param limit - the most groups returned; 10 by default.
   * @throws MixedCurrencyError when one group's money rows hold two currencies.
   * @throws TypeError for an aggregate without its path, a field that is not a single column, or a limit that is not
   *         a whole number from 1.
   */
  async breakdown(
    dimension: string,
    aggregate: Aggregate,
    path?: string,
    limit = 10,
  ): Promise<MetricBreakdown[]> {
    if (!Number.isInteger(limit) || limit < 1)
      throw new TypeError(`breakdown takes a whole number of groups from 1, got ${limit}`);
    const expression = this.expression(aggregate, path);
    const key = this.column(dimension);
    const on = this.column(this.options.on);
    const window = `${on} >= cast(? as timestamptz) and ${on} < cast(? as timestamptz)`;
    const { from, to, previous } = this.period;
    const rows = (await (
      await this.base()
    )
      .select([
        raw(`${key} as key`),
        raw(`${expression(window)} as current`, [from, to]),
        raw(`${expression(window)} as previous`, [previous.from, previous.to]),
        ...this.currencies(aggregate, path),
      ])
      .groupBy([raw("1")])
      .orderBy({ [raw("2")]: "desc" })
      .limit(limit)
      .execute("all")) as readonly Record<string, unknown>[];
    this.refuseMixed(rows, path);
    return rows.map((row) => ({
      key: (row["key"] ?? null) as MetricBreakdown["key"],
      current: Number(row["current"]),
      previous: Number(row["previous"]),
    }));
  }

  /** The aliased, quoted column of `path`. */
  private column(path: string): string {
    return `${ALIAS}.${quoteIdentifier(columnOf(this.meta, path))}`;
  }

  /** The SQL of `aggregate` over `path`. */
  private expression(aggregate: Aggregate, path: string | undefined): Expression {
    if (aggregate === Aggregate.Count) return (window) => `count(*)${filtered(window)}`;
    if (path === undefined)
      throw new TypeError(`Aggregate.${aggregate} needs the path it aggregates`);
    const column = this.column(path);
    if (aggregate === Aggregate.Distinct)
      return (window) => `count(distinct ${column})${filtered(window)}`;
    return (window) => `coalesce(${aggregate}(${column})${filtered(window)}, 0)`;
  }

  /** The distinct currency count a money aggregate selects beside its value. */
  private currencies(aggregate: Aggregate, path: string | undefined) {
    if (path === undefined || !path.endsWith(".minor") || !MONEY.has(aggregate)) return [];
    const currency = this.column(path.replace(/\.minor$/, ".currency"));
    return [raw(`count(distinct ${currency}) as currencies`)];
  }

  /** Refuses rows whose money values hold two currencies. */
  private refuseMixed(rows: readonly Record<string, unknown>[], path: string | undefined): void {
    if (rows.some((row) => Number(row["currencies"] ?? 0) > 1))
      throw MixedCurrencyError.create({ field: path ?? "" });
  }

  /** The rows that count in either period. */
  private async base() {
    const on = this.column(this.options.on);
    const range = raw(`${on} >= cast(? as timestamptz) and ${on} < cast(? as timestamptz)`, [
      this.period.previous.from,
      this.period.to,
    ]);
    const filter = await this.filter();
    return this.em
      .createQueryBuilder(this.model, ALIAS)
      .where(filter as QBFilterQuery<M>)
      .andWhere(range);
  }
}
