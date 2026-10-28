/**
 * Stackra file contract:
 * Purpose: `compileReport(declaration, request, options)`, the plan of one report run: it checks the request against
 *          the declaration, then builds the select list (dimensions, bucketed by grain in the call's time zone, and
 *          measures, formulas included), the grouping sets that put the grand totals in the same statement, a
 *          `row_number()` rank in the requested sort for paging, the money currency checks, and the conditions of the
 *          default filter and the request's filters.
 * Boundary: internal; pure apart from `options.column`, which resolves a path through the generated metadata (and
 *           joins a relation as it goes). Every name the request sends is looked up in the declaration, never written
 *           into SQL; grains are enum values and the time zone is checked, so the select and grouping text has no
 *           bound values and the grouping expressions match the selected ones. Filter values are bound parameters.
 *           Visibility, row-level security, the replica and the timeout are the driver's.
 * Runtime: node
 * Governing contract: ADR 0470 (decisions 2 and 3); ADR 0160 (parameterised SQL); ADR 0307 (rules 2 and 16).
 */
import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import { formulaNames } from "#core/functions/formula-names.function";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportMeasure } from "#core/types/report-measure.type";
import type { ReportRequest } from "#core/types/report-request.type";
import { PAGE_CURSOR } from "#node/constants/page-cursor.constant";
import { ReportRequestInvalidError } from "#node/errors/report-request-invalid.error";
import { filterSql } from "#node/functions/filter-sql.function";
import { formulaSql } from "#node/functions/formula-sql.function";
import type { CompileReportOptions } from "#node/types/compile-report-options.type";
import type { ReportPlan } from "#node/types/report-plan.type";
import type { SqlFragment } from "#node/types/sql-fragment.type";

/** The most sort keys a request takes. */
const MAX_SORT_KEYS = 3;

/** An IANA zone name (`Asia/Riyadh`, `Etc/GMT+3`, `UTC`): safe as a quoted literal. */
const TIME_ZONE = /^[A-Za-z][A-Za-z0-9_+\-/]{0,63}$/;

/** The base path of a money field: `total` for `total` or `total.minor`. */
function moneyBase(field: string): string {
  return field.endsWith(".minor") ? field.slice(0, -".minor".length) : field;
}

/**
 * The plan of `request` on the report `declaration` declares.
 *
 * @throws ReportRequestInvalidError for a name, grain, sort, pivot axis, limit or cursor the report does not allow.
 * @throws TableFilterInvalidError for a filter value outside the table filter vocabulary.
 * @example
 * compileReport(OrderSales.declaration, { dimensions: [{ name: "status" }], measures: ["orders"] }, options);
 */
export function compileReport(
  declaration: ReportDeclaration,
  request: ReportRequest,
  options: CompileReportOptions,
): ReportPlan {
  const report = declaration.key;
  const refuse = (reason: string): ReportRequestInvalidError =>
    ReportRequestInvalidError.create({ report, reason });
  const { column } = options;

  // The request names only what the report declares.
  if (!Array.isArray(request.measures) || request.measures.length === 0)
    throw refuse("name at least one measure");
  for (const name of request.measures)
    if (!Object.hasOwn(declaration.measures, name)) throw refuse(`unknown measure "${name}"`);
  if (new Set(request.measures).size !== request.measures.length)
    throw refuse("a measure is named twice");
  const dimensions = request.dimensions ?? [];
  if (new Set(dimensions.map((item) => item.name)).size !== dimensions.length)
    throw refuse("a dimension is named twice");
  if (!TIME_ZONE.test(options.timeZone))
    throw refuse(`the time zone ${JSON.stringify(options.timeZone)} is not an IANA zone name`);
  const dimensionSql = new Map<string, string>();
  for (const { name, grain } of dimensions) {
    const declared = Object.hasOwn(declaration.dimensions, name)
      ? declaration.dimensions[name]
      : undefined;
    if (declared === undefined) throw refuse(`unknown dimension "${name}"`);
    const grains = declared.grains ?? [];
    if (grain === undefined && grains.length > 0)
      throw refuse(`dimension "${name}" needs a grain: ${grains.join(", ")}`);
    if (grain !== undefined && !grains.includes(grain))
      throw refuse(`dimension "${name}" takes no grain "${String(grain)}"`);
    const field = column(declared.path);
    dimensionSql.set(
      name,
      grain === undefined ? field : `date_trunc('${grain}', ${field}, '${options.timeZone}')`,
    );
  }

  // Measures: one aggregate each, formulas inlined over the measures they read.
  const amount = (measure: ReportMeasure): string =>
    column(
      measure.metric === ReportMetric.Money
        ? `${moneyBase(String(measure.field))}.minor`
        : String(measure.field),
    );
  const measureSql = (name: string): string => {
    const measure = declaration.measures[name];
    if (measure === undefined) throw refuse(`unknown measure "${name}"`);
    switch (measure.kind) {
      case MeasureKind.Count: {
        return "count(*)";
      }
      case MeasureKind.CountDistinct: {
        return `count(distinct ${column(String(measure.field))})`;
      }
      case MeasureKind.Sum: {
        return `coalesce(sum(${amount(measure)}), 0)`;
      }
      case MeasureKind.Avg:
      case MeasureKind.Min:
      case MeasureKind.Max: {
        return `${measure.kind}(${amount(measure)})`;
      }
      default: {
        return formulaSql(String(measure.formula), (used) => `(${measureSql(used)})::numeric`);
      }
    }
  };
  // Every money measure a requested one reads (directly or through formulas) is checked for one currency.
  const money = new Set<string>();
  const reach = (name: string): void => {
    const measure = declaration.measures[name];
    if (measure?.metric === ReportMetric.Money && measure.kind !== MeasureKind.Formula)
      money.add(name);
    if (measure?.kind === MeasureKind.Formula)
      for (const used of formulaNames(String(measure.formula))) reach(used);
  };
  for (const name of request.measures) reach(name);
  const currencyOf = (name: string): string =>
    column(`${moneyBase(String(declaration.measures[name]?.field))}.currency`);

  // Sort keys are requested dimensions or measures; every dimension follows, so ties order stably.
  const sort = request.sort ?? [];
  if (sort.length > MAX_SORT_KEYS) throw refuse(`a sort takes at most ${MAX_SORT_KEYS} keys`);
  const order = sort.map(({ key, direction }) => {
    if (direction !== "asc" && direction !== "desc") throw refuse(`sort "${key}" is asc or desc`);
    const expression =
      dimensionSql.get(key) ?? (request.measures.includes(key) ? measureSql(key) : undefined);
    if (expression === undefined)
      throw refuse(`sort "${key}" is not a requested dimension or measure`);
    return `${expression} ${direction}`;
  });
  for (const expression of dimensionSql.values()) order.push(`${expression} asc`);

  if (request.pivot !== undefined)
    for (const axis of [...request.pivot.rows, ...request.pivot.columns])
      if (!dimensionSql.has(axis))
        throw refuse(`pivot axis "${axis}" is not a requested dimension`);

  // The page: a capped size and an offset the cursor carries, both within the row cap.
  const limit = request.limit ?? options.pageSize;
  if (!Number.isInteger(limit) || limit < 1) throw refuse("limit is a whole number of at least 1");
  const offset = request.cursor === undefined ? 0 : PAGE_CURSOR.decode(request.cursor);
  if (offset === undefined) throw refuse("the cursor is not one this report returned");
  if (offset >= options.maxRows)
    throw refuse(`a report reads at most ${options.maxRows} groups; narrow the filters`);
  const page = Math.min(limit, options.maxRows - offset);

  // Conditions: the default filter by path, then the request's filters by dimension name.
  const conditions: SqlFragment[] = Object.entries(declaration.defaultFilter).map(([path, value]) =>
    filterSql(column(path), path, value),
  );
  for (const [name, value] of Object.entries(request.filters ?? {})) {
    const declared = Object.hasOwn(declaration.dimensions, name)
      ? declaration.dimensions[name]
      : undefined;
    if (declared === undefined) throw refuse(`filter "${name}" is not a declared dimension`);
    if (value !== undefined) conditions.push(filterSql(column(declared.path), name, value));
  }

  const grouped = [...dimensionSql.values()].join(", ");
  const selects = [
    ...[...dimensionSql].map(([name, expression]) => `${expression} as "${name}"`),
    ...request.measures.map((name) => `${measureSql(name)} as "${name}"`),
    ...[...money].flatMap((name) => [
      `min(${currencyOf(name)}) as "${name}~currency"`,
      `count(distinct ${currencyOf(name)}) as "${name}~currencies"`,
    ]),
    ...(dimensionSql.size === 0
      ? []
      : [
          `grouping(${grouped}) as "~grouping"`,
          `row_number() over (partition by grouping(${grouped}) order by ${order.join(", ")}) as "~rank"`,
        ]),
  ];
  return {
    report,
    dimensions: [...dimensionSql.keys()],
    measures: [...request.measures],
    money: [...money],
    moneyOut: request.measures.filter(
      (name) => declaration.measures[name]?.metric === ReportMetric.Money,
    ),
    selects,
    ...(dimensionSql.size === 0 ? {} : { groupBy: `grouping sets ((${grouped}), ())` }),
    ...(conditions.length === 0
      ? {}
      : {
          where: {
            sql: conditions.map((condition) => `(${condition.sql})`).join(" and "),
            params: conditions.flatMap((condition) => condition.params),
          },
        }),
    offset,
    limit: page,
  };
}
