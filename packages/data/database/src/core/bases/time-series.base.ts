/**
 * Stackra file contract:
 * Purpose: `TimeSeries<S>({ key, time, dimensions, measures, rollups, lateness, retain })`, the kind base of a time
 *          series over a big append-only source (meter readings, telemetry, fleet positions): rollup tables
 *          `ts_<key>_<grain>` that the `data_maintenance.timeseries.rollup` job of @stackra/data-maintenance keeps,
 *          so reads of a long range never scan the raw rows, and the raw table can keep a short retention
 *          (`Partitioned`).
 * Boundary: called only, with the source model as the type argument (gone at runtime: gen reads it, and its entry
 *           pairs the class with the model through `registerTimeSeries`). It checks the declaration when the class is
 *           declared; whether the fields exist is gen's check and the run's (`columnOf`). Rollups are plain tables, not
 *           materialized views, so the source's row-level security applies to them too: the job runs once per scope,
 *           the source's scope field is a dimension, and the rollup table's migration declares the same policy. Native
 *           Postgres only; a Timescale driver would need an ADR 0160 amendment.
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0294 (decision 16: kinds by base class); ADR 0305
 *                     (rule 5: the partner is the type argument); ADR 0160 (no Timescale).
 */
import { createKind, type WithPartner } from "@stackra/container";
import { Duration, Enum } from "@stackra/contracts";

import { TimeSeriesBase } from "#core/bases/time-series-base.base";
import { Aggregate } from "#core/enums/aggregate.enum";
import { MetricGrain } from "#core/enums/metric-grain.enum";
import type { TimeSeriesClass } from "#core/types/time-series-class.type";
import type { TimeSeriesOptions } from "#core/types/time-series-options.type";

/** A series key: snake_case, short enough that `ts_<key>_quarter` stays a Postgres identifier. */
const KEY = /^[a-z][a-z0-9_]{0,47}$/;

/** A field or measure name: camelCase. */
const NAME = /^[a-z][A-Za-z0-9]*$/;

/** What a called form without its type argument fails with. */
type Hint = "Name the source model as a type argument: TimeSeries<MeterReading>({ key, ... })";

/** The called form: the source model is the partner. */
type TimeSeriesKind = <S extends object = never>(
  options: WithPartner<S, TimeSeriesOptions<S>, Hint>,
) => TimeSeriesClass<S>;

/** Whether `value` is a list of distinct camelCase names. */
function names(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && NAME.test(item)) &&
    new Set(value).size === value.length
  );
}

/**
 * Checks the options and records them frozen.
 *
 * The source is erased at runtime, so its field names are read as plain strings (with the default `object` source
 * they would be `never`).
 *
 * @throws TypeError for a bad key, time field, dimension, measure, grain, lateness or retention.
 */
function read(
  options: TimeSeriesOptions<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const key = options?.key;
  if (typeof key !== "string" || !KEY.test(key))
    throw new TypeError(
      `TimeSeries({ key }) is snake_case, at most 48 characters, such as "meter_readings", got ${JSON.stringify(key)}`,
    );
  const where = `TimeSeries "${key}"`;
  if (typeof options.time !== "string" || !NAME.test(options.time))
    throw new TypeError(`${where} needs \`time\`, the source's time field`);
  if (!names(options.dimensions) || options.dimensions.includes(options.time))
    throw new TypeError(
      `${where} dimensions are distinct camelCase fields, not the time field (its bucket is the rollup's own)`,
    );
  const measures = Object.entries(options.measures ?? {});
  if (measures.length === 0) throw new TypeError(`${where} declares no measures`);
  for (const [name, measure] of measures) {
    if (!NAME.test(name) || name === "bucket" || options.dimensions.includes(name))
      throw new TypeError(`${where} measure "${name}" is a camelCase name no dimension takes`);
    if (!Enum.values(Aggregate).includes(measure?.aggregate))
      throw new TypeError(
        `${where} measure "${name}" aggregate is one of ${Enum.values(Aggregate).join(", ")}`,
      );
    const counted = measure.aggregate === Aggregate.Count;
    if (counted ? measure.field !== undefined : !names([measure.field]))
      throw new TypeError(
        counted
          ? `${where} measure "${name}" is a count, which reads no field`
          : `${where} measure "${name}" is ${measure.aggregate}, so it needs a field`,
      );
  }
  const grains = options.rollups;
  if (
    !Array.isArray(grains) ||
    grains.length === 0 ||
    grains.some((grain) => !Enum.values(MetricGrain).includes(grain)) ||
    new Set(grains).size !== grains.length
  )
    throw new TypeError(
      `${where} rollups are distinct MetricGrain values (${Enum.values(MetricGrain).join(", ")})`,
    );
  const durations = [
    ...(options.lateness === undefined ? [] : [options.lateness]),
    ...Object.values(options.retain ?? {}),
  ];
  if (durations.some((each) => !(Duration.toMilliseconds(each as Duration) > 0)))
    throw new TypeError(`${where} lateness and retain are positive durations`);
  if (Object.keys(options.retain ?? {}).some((grain) => !grains.includes(grain as MetricGrain)))
    throw new TypeError(`${where} retains a grain it does not roll up`);
  return Object.freeze({
    ...options,
    dimensions: Object.freeze([...options.dimensions]),
    measures: Object.freeze({ ...options.measures }),
    rollups: Object.freeze([...grains]),
  });
}

/**
 * The time series kind base.
 *
 * @example
 * export class MeterReadingSeries extends TimeSeries<MeterReading>({
 *   key: "meter_readings",
 *   time: "at",
 *   dimensions: ["scopeId", "meterId"],
 *   measures: {
 *     kwh: { aggregate: Aggregate.Sum, field: "kwh" },
 *     readings: { aggregate: Aggregate.Count },
 *     peak: { aggregate: Aggregate.Max, field: "kw" },
 *   },
 *   rollups: [MetricGrain.Hour, MetricGrain.Day],
 *   retain: { [MetricGrain.Hour]: Duration.days(90) },
 * }) {}
 */
export const TimeSeries = createKind(
  "time_series",
  TimeSeriesBase,
  read,
) as unknown as TimeSeriesKind;
