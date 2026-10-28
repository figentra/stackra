/**
 * Stackra file contract:
 * Purpose: `PostgresSearchQueryLogDriver`, the server's `SearchQueryLog` over `search.queries`: `store` writes an entry
 *          (the job's side of `record`), `popular` completes a prefix from the logged phrases, and `top`,
 *          `zeroResults` and `clickThrough` are the reports an admin read or panel widget shows.
 * Boundary: abstract, so it is never bound as it stands: `record` hands the entry off the read path as the
 *           `data_maintenance.query.record` job, which needs its system-held permission above @stackra/iam, so the
 *           bound driver is `QueuedSearchQueryLogDriver` of @stackra/data-maintenance (ADR 0462 decision 1). Raw SQL on
 *           the running context's entity manager, so every read and write sits under the table's row-level security:
 *           a scope sees its own queries and its children's. Every value is bound and every result row read through
 *           zod. Reports cover the last `days` days (1 to 366) and at most 100 phrases; withheld phrases count in no
 *           report.
 * Runtime: node
 * Governing contract: ADR 0221; ADR 0160 (raw SQL is parameterised and typed with zod); ADR 0327 (decision 9: isolation
 *                     in the database); ADR 0462 (decision 1: jobs live in an add-on above iam); data-layer gaps se12
 *                     and se13 (stackra-326).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { SearchQueryLog } from "#contracts/index";
import type { SearchQueryEntry } from "#contracts/index";
import type { SearchQueryReportOptions } from "#node/types/search-query-report-options.type";
import type { SearchQueryReportRow } from "#node/types/search-query-report-row.type";

/** The query log table, in the package's schema. */
const TABLE = '"search"."queries"';

/** The most rows a report or completion returns. */
const MAX_LIMIT = 100;

/** The longest report window, in days. */
const MAX_DAYS = 366;

/** How far back completions read, in days. */
const POPULAR_DAYS = 30;

/** Rows that carry a phrase only. */
const PHRASES = z.array(z.object({ phrase: z.string() }));

/** Report rows: a phrase, how often it was searched, how many of those found nothing, and how many clicks it led to. */
const REPORT = z.array(
  z.object({
    phrase: z.string(),
    searches: z.coerce.number().int(),
    zero: z.coerce.number().int(),
    clicks: z.coerce.number().int(),
  }),
);

/**
 * Logs search queries in Postgres; a subclass hands `record` off the read path.
 *
 * @example
 * const zero = await queryLog.zeroResults({ model: "Product", days: 7 });
 */
export abstract class PostgresSearchQueryLogDriver extends Driver(SearchQueryLog) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running context each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Writes the entry as a row of `scope` (the job's side of `record`). */
  async store(scope: ScopeRef, entry: Omit<SearchQueryEntry, "scope">): Promise<void> {
    // raw-sql: an append to the query log, a table with no model
    await this.database.em().execute(
      `insert into ${TABLE} ("id", "scope_id", "scope_path", "model", "phrase", "hits", "latency_ms", "clicked_id", "searched_at")
values (gen_random_uuid(), ?, ?::ltree, ?, ?, ?, ?, ?, now())`,
      [
        scope.id,
        scope.path,
        entry.model,
        entry.phrase,
        entry.hits ?? null,
        entry.latencyMs ?? null,
        entry.clicked ?? null,
      ],
    );
  }

  /** The most frequent phrases of `model` in the last 30 days that start with `prefix` and found rows. */
  async popular(model: string, prefix: string, limit: number): Promise<readonly string[]> {
    // raw-sql: a grouped count over the query log, a table with no model
    const rows = PHRASES.parse(
      await this.database.em().execute(
        `select "phrase" from ${TABLE}
where "model" = ? and "phrase" is not null and left("phrase", length(?)) = ? and "hits" > 0
  and "searched_at" >= now() - make_interval(days => ?)
group by "phrase"
order by count(*) desc, "phrase"
limit ?`,
        [model, prefix, prefix, POPULAR_DAYS, Math.min(Math.max(limit, 1), MAX_LIMIT)],
      ),
    );
    return rows.map((row) => row.phrase);
  }

  /** The most searched phrases, with their zero-result and click counts. */
  top(options: SearchQueryReportOptions = {}): Promise<readonly SearchQueryReportRow[]> {
    return this.report("searches desc", options);
  }

  /** The phrases that most often found nothing, the content gaps to fill or the synonyms to add. */
  zeroResults(options: SearchQueryReportOptions = {}): Promise<readonly SearchQueryReportRow[]> {
    return this.report("zero desc", options, ` having count(*) filter (where "hits" = 0) > 0`);
  }

  /** The searched phrases by how many clicks they led to per search, lowest first, the results that disappoint. */
  clickThrough(options: SearchQueryReportOptions = {}): Promise<readonly SearchQueryReportRow[]> {
    return this.report(
      `(count(*) filter (where "clicked_id" is not null))::float8 / greatest(count(*) filter (where "clicked_id" is null), 1) asc`,
      options,
      ` having count(*) filter (where "clicked_id" is null) > 0`,
    );
  }

  /**
   * One report over the window, ordered by `order` (a literal of this file, never input).
   *
   * @throws RangeError for days outside 1 to 366 or a limit outside 1 to 100.
   */
  private async report(
    order: string,
    options: SearchQueryReportOptions,
    having = "",
  ): Promise<readonly SearchQueryReportRow[]> {
    const days = options.days ?? 30;
    const limit = options.limit ?? 20;
    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS)
      throw new RangeError(`A search query report covers 1 to ${MAX_DAYS} days, got ${days}`);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
      throw new RangeError(`A search query report lists 1 to ${MAX_LIMIT} phrases, got ${limit}`);
    // raw-sql: grouped counts over the query log, a table with no model
    const rows = REPORT.parse(
      await this.database.em().execute(
        `select "phrase",
  count(*) filter (where "clicked_id" is null) as searches,
  count(*) filter (where "clicked_id" is null and "hits" = 0) as zero,
  count(*) filter (where "clicked_id" is not null) as clicks
from ${TABLE}
where "phrase" is not null and "searched_at" >= now() - make_interval(days => ?)${options.model === undefined ? "" : ` and "model" = ?`}
group by "phrase"${having}
order by ${order}, "phrase"
limit ?`,
        [days, ...(options.model === undefined ? [] : [options.model]), limit],
      ),
    );
    return rows;
  }
}
