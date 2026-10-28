/**
 * Stackra file contract:
 * Purpose: `PostgresReportRunnerDriver`, the report compiler: the `postgres` driver of the `ReportRunner` port. It
 *          compiles a `ReportRequest` into one parameterised statement through the ORM query builder (grouping sets put
 *          the groups and the grand totals in the same statement, a rank pages them), narrows it to the rows the
 *          caller may see, and runs it on the read replica inside a transaction with the configured statement timeout.
 * Boundary: implements the port only. The source model comes from `registerReportSources` (generated wiring). Record
 *           visibility is `visibleKeysQuery`, the same conditions `visibleFilter` ANDs into every `CrudService` read;
 *           scope isolation stays row-level security: the statement runs in the caller's transaction settings, which
 *           `Database.onReplica` replays on the replica, and nothing here widens them. The time zone of a time grain is
 *           the running call's (`ContextStorage`), UTC outside a call. The row cap bounds a page and the cursor.
 *           Subtotals per level and the pivot matrix are stackra-391; column visibility is stackra-395.
 * Runtime: node
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0333 (decisions 4 and 5: record visibility); ADR 0160
 *                     (parameterised SQL); ADR 0057 (decision 6: read replica); ADR 0307 (rule 16); ADR 0294
 *                     (decisions 16 and 25).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { sql, visibleKeysQuery } from "@stackra/database";
import type { Database } from "@stackra/database";

import { ReportRunner } from "#core/ports/report-runner.port";
import type { ReportClass } from "#core/types/report-class.type";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportRequest } from "#core/types/report-request.type";
import type { ReportResult } from "#core/types/report-result.type";
import type { ReportsConfig } from "#node/config/reports.config";
import { REPORT_SOURCES } from "#node/constants/report-sources.constant";
import { columnResolver } from "#node/functions/column-resolver.function";
import { compileReport } from "#node/functions/compile-report.function";
import { reportResultOf } from "#node/functions/report-result-of.function";
import type { SourceMeta } from "#node/types/source-meta.type";
import type { SqlFragment } from "#node/types/sql-fragment.type";

/** A raw fragment of `text` with no bound values, through the database's `sql` tag. */
function fragment(text: string): ReturnType<typeof sql> {
  return sql(Object.assign([text], { raw: [text] }) as unknown as TemplateStringsArray);
}

/** The pages of a grouped statement: every group of the page plus one, and the grand-total row. */
const PAGE = (inner: string): string =>
  `select * from (${inner}) as "report" where "~grouping" <> 0 or ("~rank" > ? and "~rank" <= ?) order by "~grouping", "~rank"`;

/**
 * Runs reports on Postgres.
 *
 * @example
 * // generated wiring: { port: ReportRunner, candidates: { postgres: … }, deps: { postgres: [Database, ContextStorage, ReportsConfig] } }
 */
export class PostgresReportRunnerDriver extends Driver(ReportRunner) {
  /** The service's database. */
  private readonly database: Database;

  /** The running call, for its time zone. */
  private readonly storage: ContextStorage;

  /** Page size, row cap, timeout and replica. */
  private readonly config: ReportsConfig;

  /**
   * @param database - the service's database.
   * @param storage - the running call's context.
   * @param config - the report runner's configuration.
   */
  constructor(database: Database, storage: ContextStorage, config: ReportsConfig) {
    super();
    this.database = database;
    this.storage = storage;
    this.config = config;
  }

  /**
   * Implements `ReportRunner.run`, documented there.
   *
   * @throws ReportRequestInvalidError for a request the report does not allow.
   * @throws TableFilterInvalidError for a filter value outside the vocabulary.
   * @throws MixedCurrencyError when a money measure spans two currencies.
   * @throws TypeError for a class that is no report, or one with no registered source model.
   */
  run(report: ReportClass, request: ReportRequest): Promise<ReportResult> {
    const record = kindOf(report);
    if (record?.kind !== "report")
      throw new TypeError(`${report.name} extends no Report<S>({ key, dimensions, measures })`);
    const declaration = record.options as unknown as ReportDeclaration;
    const model = this.sourceOf(report);
    const context = this.storage.current() as { readonly timeZone?: string } | undefined;
    const timeZone = context?.timeZone ?? "UTC";
    const work = (): Promise<ReportResult> =>
      this.database.transaction(() => this.execute(model, declaration, request, timeZone), {
        timeout: this.config.timeout,
      });
    return this.config.replica ? this.database.onReplica(work) : work();
  }

  /** Compiles and runs one statement. */
  private async execute(
    model: AnyClass,
    declaration: ReportDeclaration,
    request: ReportRequest,
    timeZone: string,
  ): Promise<ReportResult> {
    const em = this.database.em();
    const meta = em.getMetadata(model) as unknown as SourceMeta;
    const qb = em.createQueryBuilder(model, "row");
    const column = columnResolver(meta, (field, alias) => {
      qb.leftJoin(field as never, alias);
    });
    const plan = compileReport(declaration, request, {
      column,
      timeZone,
      pageSize: this.config.pageSize,
      maxRows: this.config.maxRows,
    });
    const conditions: SqlFragment[] = plan.where === undefined ? [] : [plan.where];
    const visible = await visibleKeysQuery(model);
    if (visible !== undefined)
      conditions.push({
        sql: `${column(meta.primaryKeys[0] ?? "id")} in (${visible.sql})`,
        params: visible.params,
      });
    qb.select(plan.selects.map(fragment) as never);
    if (conditions.length > 0)
      qb.where(
        conditions.map((condition) => `(${condition.sql})`).join(" and "),
        conditions.flatMap((condition) => [...condition.params]),
      );
    if (plan.groupBy !== undefined) qb.groupBy(fragment(plan.groupBy) as never);
    const inner = qb.toQuery();
    const rows: Readonly<Record<string, unknown>>[] =
      plan.groupBy === undefined
        ? await em.execute(inner.sql, [...inner.params], "all")
        : await em.execute(
            PAGE(inner.sql),
            [...inner.params, plan.offset, plan.offset + plan.limit + 1],
            "all",
          );
    return reportResultOf(plan, declaration, rows, this.config.maxRows);
  }

  /**
   * The source model of `report` or its nearest ancestor.
   *
   * @throws TypeError when none is registered.
   */
  private sourceOf(report: ReportClass): AnyClass {
    for (
      let current: object | null = report;
      current !== null && current !== Function.prototype;
      current = Object.getPrototypeOf(current) as object | null
    ) {
      const model = REPORT_SOURCES.get(current);
      if (model !== undefined) return model;
    }
    throw new TypeError(
      `No source model is registered for ${report.name}: gen registers its type argument with registerReportSources`,
    );
  }
}
