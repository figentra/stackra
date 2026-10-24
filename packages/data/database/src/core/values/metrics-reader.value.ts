/**
 * Stackra file contract:
 * Purpose: `MetricsReader`, what `CrudService.metrics(period, { on, where })` returns: the count or a sum over the
 *          period and the period before it, and their daily series, each in one statement.
 * Boundary: reads only, through the ORM's query builder so `where` is the typed filter; field paths resolve through
 *           the generated metadata, never as written. A money sum refuses rows in two currencies. Days are 24-hour
 *           buckets from the period's start.
 *           shortcut: a day that crosses a daylight-saving change is an hour off; bucket by the call's time zone when
 *           a member reports per local day in such a zone.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 15 and 16); ADR 0160 (parameterised SQL).
 */
import { raw } from "@mikro-orm/core";
import type { EntityMetadata } from "@mikro-orm/core";
import type { EntityManager, QBFilterQuery } from "@mikro-orm/postgresql";
import type { Period } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

import { Aggregate } from "#core/enums/aggregate.enum";
import { MixedCurrencyError } from "#core/errors/mixed-currency.error";
import { columnOf } from "#core/functions/column-of.function";
import { filterOf } from "#core/functions/filter-of.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { MetricSeries } from "#core/types/metric-series.type";
import type { MetricValue } from "#core/types/metric-value.type";
import type { MetricsOptions } from "#core/types/metrics-options.type";

/** The query alias the raw expressions name. */
const ALIAS = "row";

/** Milliseconds in one bucket. */
const DAY = 86_400_000;

/**
 * Metrics of `M` over one period.
 *
 * @example
 * const paid = orders.metrics(period, { on: "paidAt", where: { status: OrderStatus.Paid } });
 * const [revenue, count] = await Promise.all([paid.sum("total.minor"), paid.count()]);
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

  /**
   * @param em - the entity manager of the call.
   * @param model - the model to aggregate.
   * @param period - the period and its previous period.
   * @param options - the instant field and the rows that count.
   * @throws TypeError when `options.on` is not a single-column field.
   */
  constructor(em: EntityManager, model: AnyClass<M>, period: Period, options: MetricsOptions<M>) {
    this.em = em;
    this.model = model;
    this.meta = em.getMetadata(model);
    this.period = period;
    this.options = options;
    this.column(options.on);
  }

  /** How many rows fall in the period and in the previous one. */
  async count(): Promise<MetricValue> {
    const row = await this.window((window) => `count(*) filter (where ${window})`);
    return { current: Number(row["current"]), previous: Number(row["previous"]) };
  }

  /**
   * The sum of `path` over the period and the previous one.
   *
   * @throws MixedCurrencyError when `path` is a money amount (`<field>.minor`) and the rows hold two currencies.
   * @throws TypeError when `path` is not a single-column field.
   */
  async sum(path: string): Promise<MetricValue> {
    const column = this.column(path);
    const currency = path.endsWith(".minor") ? path.replace(/\.minor$/, ".currency") : undefined;
    const row = await this.window(
      (window) => `coalesce(sum(${column}) filter (where ${window}), 0)`,
      currency === undefined ? [] : [`count(distinct ${this.column(currency)}) as currencies`],
    );
    if (Number(row["currencies"] ?? 0) > 1) throw MixedCurrencyError.create({ field: path });
    return { current: Number(row["current"]), previous: Number(row["previous"]) };
  }

  /**
   * One value per day of the period and of the previous period.
   *
   * @param aggregate - `Aggregate.Count`, or `Aggregate.Sum` with `path`.
   * @throws TypeError for a sum without a path, or a path that is not a single-column field.
   */
  async series(aggregate: Aggregate, path?: string): Promise<MetricSeries> {
    if (aggregate === Aggregate.Sum && path === undefined)
      throw new TypeError("series(Aggregate.Sum, path) needs the summed path");
    const value =
      aggregate === Aggregate.Sum ? `coalesce(sum(${this.column(path ?? "")}), 0)` : "count(*)";
    const on = this.column(this.options.on);
    const { from, previous } = this.period;
    const start = `case when ${on} >= cast(? as timestamptz) then cast(? as timestamptz) else cast(? as timestamptz) end`;
    const rows = (await this.base()
      .select([
        raw(`${on} >= cast(? as timestamptz) as is_current`, [from]),
        raw(`floor(extract(epoch from (${on} - (${start}))) * 1000 / ${DAY})::int as bucket`, [
          from,
          from,
          previous.from,
        ]),
        raw(`${value} as value`),
      ])
      .groupBy([raw("1"), raw("2")])
      .execute("all")) as readonly Record<string, unknown>[];
    const days = this.period.days;
    const series = {
      current: Array.from({ length: days }, () => 0),
      previous: Array.from({ length: days }, () => 0),
    };
    for (const row of rows) {
      const bucket = Number(row["bucket"]);
      if (bucket < 0 || bucket >= days) continue;
      (row["is_current"] === true ? series.current : series.previous)[bucket] = Number(
        row["value"],
      );
    }
    return series;
  }

  /** The aliased, quoted column of `path`. */
  private column(path: string): string {
    return `${ALIAS}.${quoteIdentifier(columnOf(this.meta, path))}`;
  }

  /** The rows that count in either period. */
  private base() {
    const on = this.column(this.options.on);
    const range = raw(`${on} >= cast(? as timestamptz) and ${on} < cast(? as timestamptz)`, [
      this.period.previous.from,
      this.period.to,
    ]);
    return this.em
      .createQueryBuilder(this.model, ALIAS)
      .where(filterOf(this.options.where ?? {}) as QBFilterQuery<M>)
      .andWhere(range);
  }

  /** One statement: `aggregate` over the period as `current`, over the previous period as `previous`, plus `extra`. */
  private async window(
    aggregate: (window: string) => string,
    extra: readonly string[] = [],
  ): Promise<Record<string, unknown>> {
    const on = this.column(this.options.on);
    const window = `${on} >= cast(? as timestamptz) and ${on} < cast(? as timestamptz)`;
    const { from, to, previous } = this.period;
    const row = await this.base()
      .select([
        raw(`${aggregate(window)} as current`, [from, to]),
        raw(`${aggregate(window)} as previous`, [previous.from, previous.to]),
        ...extra.map((expression) => raw(expression)),
      ])
      .execute("get");
    return (row ?? {}) as Record<string, unknown>;
  }
}
