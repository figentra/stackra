/**
 * Stackra file contract:
 * Purpose: `PostgresScheduleDriver`, the server's `ScheduleDriver`: schedules are rows of `scheduler.schedules` and
 *          watermarks rows of `scheduler.watermarks`, advanced together in one upsert per tick.
 * Boundary: raw SQL on the running context's entity manager, one statement per method, every value a bound parameter
 *           and every result row read through zod. Inside the tick's lock (a Postgres transaction) each statement joins
 *           it, so the watermarks commit with the jobs the tick pushed or not at all. The tables have no row-level
 *           security: the tick reads every scope, and a scope's reads and deletes bind `scope_id` themselves.
 * Runtime: node
 * Governing contract: ADR 0148 (decisions 4 and 5); ADR 0160 (raw SQL is parameterised and typed with zod); ADR 0142
 *                     (drivers behind ports); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { Misfire, ScheduleDriver } from "#contracts/index";
import type { Schedule } from "#contracts/index";

/** The schedule table, in the package's schema. */
const SCHEDULES = '"scheduler"."schedules"';

/** The watermark table, in the package's schema. */
const WATERMARKS = '"scheduler"."watermarks"';

/** The columns a schedule is read from. */
const COLUMNS = "id, scope_id, scope_path, job_key, cron, time_zone, input, misfire, created_at";

/** Rows of `scheduler.schedules`. */
const ROWS = z.array(
  z.object({
    id: z.string().startsWith("sch_"),
    scope_id: z.string().startsWith("scp_"),
    scope_path: z.string(),
    job_key: z.string(),
    cron: z.string(),
    time_zone: z.string(),
    input: z.record(z.string(), z.unknown()),
    misfire: z.enum(Enum.values(Misfire) as [Misfire, ...Misfire[]]),
    created_at: z.coerce.date(),
  }),
);

/** Rows of `scheduler.watermarks`. */
const MARKS = z.array(z.object({ schedule_key: z.string(), ticked_at: z.coerce.date() }));

/** Rows that carry only an id. */
const IDS = z.array(z.object({ id: z.string() }));

/**
 * Keeps schedules in Postgres.
 *
 * @example
 * // generated wiring: { port: ScheduleDriver, selectedBy: "config:scheduler.driver", candidates: { postgres: … } }
 */
export class PostgresScheduleDriver extends Driver(ScheduleDriver) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * Builds the driver over the connected database.
   *
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Inserts `schedule` (see `ScheduleDriver.add`). */
  async add(schedule: Schedule): Promise<void> {
    // raw-sql: the schedule table has no model; one parameterised insert
    await this.database
      .em()
      .execute(
        `insert into ${SCHEDULES} (id, scope_id, scope_path, job_key, cron, time_zone, input, misfire, created_at) ` +
          "values (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)",
        [
          schedule.id,
          schedule.scope.id,
          schedule.scope.path,
          schedule.key,
          schedule.cron,
          schedule.timeZone,
          JSON.stringify(schedule.input),
          schedule.misfire,
          schedule.createdAt,
        ],
      );
  }

  /** Deletes schedule `id` of `scope` and its watermark (see `ScheduleDriver.remove`). */
  async remove(id: PublicId<"sch">, scope: ScopeRef): Promise<boolean> {
    // raw-sql: the schedule and its watermark go in one statement, so neither outlives the other
    const rows = await this.database
      .em()
      .execute(
        `with gone as (delete from ${SCHEDULES} where id = ? and scope_id = ? returning id), ` +
          `marks as (delete from ${WATERMARKS} where schedule_key in (select id from gone)) ` +
          "select id from gone",
        [id, scope.id],
      );
    return IDS.parse(rows).length > 0;
  }

  /** Lists the schedules of `scope`, or of every scope (see `ScheduleDriver.schedules`). */
  async schedules(scope?: ScopeRef): Promise<readonly Schedule[]> {
    const filter = scope === undefined ? "" : " where scope_id = ?";
    // raw-sql: the schedule table has no model; ids are UUIDv7, so ordering by id is creation order
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from ${SCHEDULES}${filter} order by id`,
        scope === undefined ? [] : [scope.id],
      );
    return ROWS.parse(rows).map((row) =>
      Object.freeze({
        id: row.id as PublicId<"sch">,
        scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path },
        key: row.job_key,
        cron: row.cron,
        timeZone: row.time_zone,
        input: row.input,
        misfire: row.misfire,
        createdAt: row.created_at,
      }),
    );
  }

  /** Reads every watermark, by key (see `ScheduleDriver.watermarks`). */
  async watermarks(): Promise<ReadonlyMap<string, Date>> {
    // raw-sql: the watermark table has no model; one read of every key
    const rows = await this.database
      .em()
      .execute(`select schedule_key, ticked_at from ${WATERMARKS}`, []);
    return new Map(MARKS.parse(rows).map((row) => [row.schedule_key, row.ticked_at]));
  }

  /** Upserts the watermark of each key to `at` (see `ScheduleDriver.advance`). */
  async advance(keys: readonly string[], at: Date): Promise<void> {
    if (keys.length === 0) return;
    // raw-sql: every key in one upsert, the keys bound as one JSON array
    await this.database
      .em()
      .execute(
        `insert into ${WATERMARKS} (schedule_key, ticked_at) ` +
          "select key, ?::timestamptz from jsonb_array_elements_text(?::jsonb) as keys(key) " +
          "on conflict (schedule_key) do update set ticked_at = excluded.ticked_at",
        [at, JSON.stringify(keys)],
      );
  }
}
