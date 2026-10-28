/**
 * Stackra file contract:
 * Purpose: `PostgresReportEngineDriver`, the report compiler: the `postgres` driver of the `ReportEngine` port. It
 *          compiles a run into one parameterised statement through the ORM query builder (grouping sets put the groups
 *          and the grand totals in the same statement, a rank pages them), narrows it to the rows the caller may see,
 *          and runs it on the read replica inside a transaction with the configured statement timeout.
 * Boundary: implements the port only; `ReportRunner` hands it the declaration, the source model and the time zone.
 *           Record visibility is `visibleKeysQuery`, the same conditions `visibleFilter` ANDs into every `CrudService`
 *           read; scope isolation stays row-level security: the statement runs in the caller's transaction settings,
 *           which `Database.onReplica` replays on the replica, and nothing here widens them. The row cap bounds a page
 *           and the cursor. Subtotals per leading dimension and the pivot margins are further grouping sets of the same
 *           statement (`pageSql` reads them); column visibility is stackra-395.
 * Runtime: node
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0333 (decisions 4 and 5: record visibility); ADR 0160
 *                     (parameterised SQL); ADR 0057 (decision 6: read replica); ADR 0307 (rule 16); ADR 0294
 *                     (decisions 16 and 25).
 */
import type { AnyClass } from "@stackra/container";
import { Driver } from "@stackra/container";
import { sql, visibleKeysQuery } from "@stackra/database";
import type { Database } from "@stackra/database";

import { ReportEngine } from "#contracts/ports/report-engine.port";
import type { ReportEngineQuery } from "#contracts/types/report-engine-query.type";
import type { ReportEngineResult } from "#contracts/types/report-engine-result.type";
import type { ReportsConfig } from "#node/config/reports.config";
import { columnResolver } from "#node/functions/column-resolver.function";
import { compileReport } from "#node/functions/compile-report.function";
import { pageSql } from "#node/functions/page-sql.function";
import { reportResultOf } from "#node/functions/report-result-of.function";
import type { SourceMeta } from "#node/types/source-meta.type";
import type { SqlFragment } from "#node/types/sql-fragment.type";

/** A raw fragment of `text` with no bound values, through the database's `sql` tag. */
function fragment(text: string): ReturnType<typeof sql> {
  return sql(Object.assign([text], { raw: [text] }) as unknown as TemplateStringsArray);
}

/**
 * Runs reports on Postgres.
 *
 * @example
 * // generated wiring: { port: ReportEngine, selectedBy: "config:reports.engine", candidates: { postgres: … }, deps: { postgres: [Database, ReportsConfig] } }
 */
export class PostgresReportEngineDriver extends Driver(ReportEngine) {
  /** The service's database. */
  private readonly database: Database;

  /** Page size, row cap, timeout and replica. */
  private readonly config: ReportsConfig;

  /**
   * @param database - the service's database.
   * @param config - the reports configuration.
   */
  constructor(database: Database, config: ReportsConfig) {
    super();
    this.database = database;
    this.config = config;
  }

  /**
   * Implements `ReportEngine.run`, documented there.
   *
   * @throws ReportRequestInvalidError for a request the report does not allow.
   * @throws TableFilterInvalidError for a filter value outside the vocabulary.
   * @throws MixedCurrencyError when a money measure spans two currencies.
   */
  run(query: ReportEngineQuery): Promise<ReportEngineResult> {
    const work = (): Promise<ReportEngineResult> =>
      this.database.transaction(() => this.execute(query), { timeout: this.config.timeout });
    return this.config.replica ? this.database.onReplica(work) : work();
  }

  /** Compiles and runs one statement. */
  private async execute({
    declaration,
    source,
    request,
    timeZone,
  }: ReportEngineQuery): Promise<ReportEngineResult> {
    const model: AnyClass = source;
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
        sql: `(${column(meta.primaryKeys[0] ?? "id")} in (${visible.sql}))`,
        params: visible.params,
      });
    qb.select(plan.selects.map(fragment) as never);
    if (conditions.length > 0)
      qb.where(
        // plan.where is already its parenthesised conditions ANDed.
        conditions.map((condition) => condition.sql).join(" and "),
        conditions.flatMap((condition) => [...condition.params]),
      );
    if (plan.groupBy !== undefined) qb.groupBy(fragment(plan.groupBy) as never);
    const inner = qb.toQuery();
    const page = pageSql(plan, inner.sql);
    const rows: Readonly<Record<string, unknown>>[] = await em.execute(
      page.sql,
      [...inner.params, ...page.params],
      "all",
    );
    return reportResultOf(plan, declaration, rows, this.config.maxRows);
  }
}
