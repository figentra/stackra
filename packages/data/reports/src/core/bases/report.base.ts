/**
 * Stackra file contract:
 * Purpose: `Report<Source>({ key, dimensions, measures, defaultFilter, permission })`, the kind base of a module's
 *          report: `class OrderSalesReport extends Report<Order>({ key: "order_sales", ... }) {}` in a module's
 *          `reports/<name>.report.ts`. It checks the closed vocabulary when the class is declared: dimension paths and
 *          grains, measure kinds with the field each needs, money only where it adds up, and formulas that parse and
 *          name declared measures without a cycle.
 * Boundary: called only, with the source (a model or a projection row) as the type argument (gone at runtime: gen
 *           reads it). A binding with no constructor dependencies. It declares; gen records it under the manifest's
 *           `reports` and writes its query into `#stackra/reports`, and the `ReportRunner` port runs it. Whether a
 *           path exists on the source is gen's check (it reads the model), not this one's.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 1 and 2); ADR 0294 (decision 16: kinds by base class; `@Report` retired);
 *                     ADR 0305 (rule 5: the partner is the type argument); ADR 0154 (no tenant code or SQL).
 */
import { createKind, type WithPartner } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { ReportBase } from "#core/bases/report-base.base";
import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import { TimeGrain } from "#core/enums/time-grain.enum";
import { formulaNames } from "#core/functions/formula-names.function";
import type { ReportClass } from "#core/types/report-class.type";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportDimension } from "#core/types/report-dimension.type";
import type { ReportMeasure } from "#core/types/report-measure.type";
import type { ReportOptions } from "#core/types/report-options.type";

/** A written key: snake_case words joined by dots. */
const KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

/** A dimension or measure name: camelCase. */
const NAME = /^[a-z][A-Za-z0-9]*$/;

/** A field path: camelCase segments joined by dots. */
const PATH = /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)*$/;

/** The measure kinds that read no field. */
const FIELDLESS = new Set<string>([MeasureKind.Count, MeasureKind.Formula]);

/** The measure kinds a money measure may use: those that keep one currency's amounts apart. */
const MONEY_KINDS = new Set<string>([
  MeasureKind.Sum,
  MeasureKind.Avg,
  MeasureKind.Min,
  MeasureKind.Max,
]);

/** What a called form without its type argument fails with. */
type Hint = "Name the source as a type argument: Report<Order>({ key, dimensions, measures })";

/** The called form: the source type is the partner. */
type ReportKind = <S extends object = never>(
  options: WithPartner<S, ReportOptions<S>, Hint>,
) => ReportClass<S>;

/** `value` as a plain object, or undefined. */
function objectOf(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/** The named entries of `value`, at least one, each with a camelCase name. */
function namedEntries(
  key: string,
  what: string,
  value: unknown,
): [string, Readonly<Record<string, unknown>>][] {
  const entries = Object.entries(objectOf(value) ?? {});
  if (entries.length === 0)
    throw new TypeError(`Report "${key}" declares no ${what}: name at least one`);
  return entries.map(([name, item]) => {
    const entry = objectOf(item);
    if (!NAME.test(name) || entry === undefined)
      throw new TypeError(
        `Report "${key}" ${what} "${name}" is a camelCase name with an options object`,
      );
    return [name, entry];
  });
}

/** Checks one dimension. */
function dimensionOf(
  key: string,
  name: string,
  item: Readonly<Record<string, unknown>>,
): ReportDimension {
  const path = item["path"];
  if (typeof path !== "string" || !PATH.test(path))
    throw new TypeError(
      `Report "${key}" dimension "${name}" needs a field path such as "placedAt" or "customer.country"`,
    );
  const grains = item["grains"];
  if (grains === undefined) return Object.freeze({ path });
  const known = new Set<unknown>(Enum.values(TimeGrain));
  if (
    !Array.isArray(grains) ||
    grains.length === 0 ||
    grains.some((grain) => !known.has(grain)) ||
    new Set(grains).size !== grains.length
  )
    throw new TypeError(
      `Report "${key}" dimension "${name}" grains are distinct TimeGrain values (${[...known].join(", ")})`,
    );
  return Object.freeze({ path, grains: Object.freeze([...(grains as TimeGrain[])]) });
}

/** Checks one measure, except its formula's names. */
function measureOf(
  key: string,
  name: string,
  item: Readonly<Record<string, unknown>>,
): ReportMeasure {
  const where = `Report "${key}" measure "${name}"`;
  const kind = item["kind"];
  if (typeof kind !== "string" || !Enum.values(MeasureKind).includes(kind as MeasureKind))
    throw new TypeError(`${where} kind is one of ${Enum.values(MeasureKind).join(", ")}`);
  const metric = item["metric"];
  if (typeof metric !== "string" || !Enum.values(ReportMetric).includes(metric as ReportMetric))
    throw new TypeError(`${where} metric is one of ${Enum.values(ReportMetric).join(", ")}`);
  if (metric === ReportMetric.Money && !MONEY_KINDS.has(kind))
    throw new TypeError(
      `${where} is money, so its kind is sum, avg, min or max (amounts stay per currency)`,
    );
  const field = item["field"];
  if (FIELDLESS.has(kind) ? field !== undefined : typeof field !== "string" || !PATH.test(field))
    throw new TypeError(
      FIELDLESS.has(kind)
        ? `${where} is ${kind}, which reads no field`
        : `${where} is ${kind}, so it needs a field path`,
    );
  const formula = item["formula"];
  if (kind === MeasureKind.Formula) {
    if (typeof formula !== "string")
      throw new TypeError(`${where} is a formula, so it needs \`formula\``);
    formulaNames(formula);
    return Object.freeze({ kind: kind as MeasureKind, metric: metric as ReportMetric, formula });
  }
  if (formula !== undefined)
    throw new TypeError(`${where} is ${kind}; only a formula measure takes \`formula\``);
  const checked = { kind: kind as MeasureKind, metric: metric as ReportMetric };
  return Object.freeze(field === undefined ? checked : { ...checked, field: field as string });
}

/** Refuses a formula naming an undeclared measure, itself, or a cycle. */
function checkFormulas(key: string, measures: Readonly<Record<string, ReportMeasure>>): void {
  const reads = (name: string): readonly string[] => {
    const formula = measures[name]?.formula;
    return formula === undefined ? [] : formulaNames(formula);
  };
  for (const name of Object.keys(measures))
    for (const used of reads(name))
      if (measures[used] === undefined)
        throw new TypeError(
          `Report "${key}" measure "${name}" reads "${used}", which the report does not declare`,
        );
  const done = new Set<string>();
  const visit = (name: string, path: readonly string[]): void => {
    if (path.includes(name))
      throw new TypeError(`Report "${key}" formulas form a cycle: ${[...path, name].join(" -> ")}`);
    if (done.has(name)) return;
    for (const used of reads(name)) visit(used, [...path, name]);
    done.add(name);
  };
  for (const name of Object.keys(measures)) visit(name, []);
}

/**
 * Checks the options and records the frozen declaration.
 *
 * @throws TypeError for a bad key, dimension, measure, formula or default filter.
 */
function read(options: ReportOptions): Readonly<Record<string, unknown>> {
  const key = options?.key;
  if (typeof key !== "string" || !KEY.test(key))
    throw new TypeError(
      `Report({ key }) is snake_case words joined by dots, such as "order_sales", got ${JSON.stringify(key)}`,
    );
  const dimensions = Object.fromEntries(
    namedEntries(key, "dimensions", options.dimensions).map(([name, item]) => [
      name,
      dimensionOf(key, name, item),
    ]),
  );
  const measures = Object.fromEntries(
    namedEntries(key, "measures", options.measures).map(([name, item]) => {
      if (name in dimensions)
        throw new TypeError(`Report "${key}" names "${name}" as both a dimension and a measure`);
      return [name, measureOf(key, name, item)];
    }),
  );
  checkFormulas(key, measures);
  const filter = options.defaultFilter === undefined ? {} : objectOf(options.defaultFilter);
  if (filter === undefined || Object.keys(filter).some((path) => !PATH.test(path)))
    throw new TypeError(`Report "${key}" defaultFilter maps field paths to constant values`);
  const declaration: ReportDeclaration = {
    key,
    dimensions: Object.freeze(dimensions),
    measures: Object.freeze(measures),
    defaultFilter: Object.freeze({ ...filter }) as ReportDeclaration["defaultFilter"],
    ...(options.permission !== undefined ? { permission: options.permission } : {}),
  };
  // The kind registry holds plain records; the base reads it back as a `ReportDeclaration`.
  return Object.freeze({ ...declaration });
}

/**
 * The report kind base.
 *
 * @example
 * export class OrderSalesReport extends Report<Order>({
 *   key: "order_sales",
 *   dimensions: {
 *     placedAt: { path: "placedAt", grains: [TimeGrain.Day, TimeGrain.Month] },
 *     status: { path: "status" },
 *     country: { path: "customer.country" },
 *   },
 *   measures: {
 *     orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
 *     revenue: { kind: MeasureKind.Sum, field: "total", metric: ReportMetric.Money },
 *     buyers: { kind: MeasureKind.CountDistinct, field: "customerId", metric: ReportMetric.Count },
 *     perBuyer: { kind: MeasureKind.Formula, formula: "orders / buyers", metric: ReportMetric.Number },
 *   },
 *   defaultFilter: { status: "paid" },
 *   permission: OrderPermissions.report,
 * }) {}
 */
export const Report = createKind("report", ReportBase, read) as unknown as ReportKind;
