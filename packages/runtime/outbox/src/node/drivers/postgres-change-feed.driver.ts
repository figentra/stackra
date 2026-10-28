/**
 * Stackra file contract:
 * Purpose: `PostgresChangeFeedDriver`, the server's `ChangeFeed`: entries are rows of the day-partitioned
 *          `outbox.changes`, appended in the caller's transaction with its scope, listed in `(tx, seq)` order once no
 *          running transaction can still precede them; cursors are rows of `outbox.change_cursors`; maintenance makes
 *          the next days' partitions and drops whole expired ones.
 * Boundary: raw SQL on the running context's entity manager, every value a bound parameter and every result row read
 *           through zod. A position is `<tx>:<seq>`, opaque to callers. `read` lists only entries whose transaction is
 *           older than the snapshot's `xmin`: every such transaction has ended, so nothing can later appear before the
 *           cursor (an entry of a still-running one waits for a later tick). Partitions are made from tomorrow on, so a
 *           day whose rows already sit in `changes_default` never blocks one; expired default rows are deleted. A change
 *           names a row, not a record a legal hold covers, so retention asks no `HoldRegistry`.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0160 (raw SQL is parameterised and typed
 *                     with zod); ADR 0142 (drivers behind ports); data-layer gaps cdc1 and cdc6.
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { ChangeFeed } from "#contracts/index";
import type { ChangeCursor, ChangeLogReport, ChangeRecord, RowChange } from "#contracts/index";
import { insertChanges } from "#node/functions/insert-changes.function";

/** The change log and the cursors, in the package's schema. */
const TABLE = "outbox.changes";
const CURSORS = "outbox.change_cursors";

/** Days of partitions made ahead of today. */
const PREMAKE_DAYS = 3;

/** One day in milliseconds. */
const DAY = 86_400_000;

/** A position: the writing transaction and the entry's order. */
const POSITION = /^(\d+):(\d+)$/;

/** A dated partition's name. */
const DATED = /^changes_p(\d{4})(\d{2})(\d{2})$/;

/** A Postgres bigint, read as text or a number. */
const BIGINT = z.union([z.string(), z.number()]).transform(String);

/** One row of `outbox.changes`. */
const ROW = z.object({
  tx: z.string(),
  seq: BIGINT,
  data: z.record(z.string(), z.unknown()),
  meta: z.record(z.string(), z.unknown()),
  occurred_at: z.coerce.date(),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
});

/** A position row. */
const AT = z.array(z.object({ tx: z.string(), seq: BIGINT }));

/** One row of `outbox.change_cursors`. */
const CURSOR = z.object({
  consumer: z.string(),
  position: z.string().nullable(),
  attempts: z.number().int(),
  available_at: z.coerce.date(),
  last_error: z.object({ code: z.string(), message: z.string() }).nullable(),
  stalled_at: z.coerce.date().nullable(),
});

/** The tx and seq of `position`. */
function parsePosition(position: string): readonly [string, string] {
  const match = POSITION.exec(position);
  if (match === null) throw new TypeError(`"${position}" is not a change log position`);
  return [match[1] as string, match[2] as string];
}

/** The entry of one row. */
function recordOf(row: z.infer<typeof ROW>): ChangeRecord {
  return Object.freeze({
    position: `${row.tx}:${row.seq}`,
    change: row.data as unknown as RowChange,
    meta: row.meta as ChangeRecord["meta"],
    occurredAt: row.occurred_at,
    ...(row.scope_id === null || row.scope_path === null
      ? {}
      : { scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path } }),
  });
}

/** `yyyymmdd` of a UTC instant. */
function stamp(instant: Date): string {
  return instant.toISOString().slice(0, 10).replaceAll("-", "");
}

/**
 * Keeps the change log in Postgres.
 *
 * @example
 * // generated wiring: { port: ChangeFeed, selectedBy: "config:outbox.driver", candidates: { postgres: … } }
 */
export class PostgresChangeFeedDriver extends Driver(ChangeFeed) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `ChangeFeed.append`, documented there. */
  append(entries: readonly Omit<ChangeRecord, "position">[]): Promise<void> {
    return insertChanges(this.database.em(), entries);
  }

  /**
   * Implements `ChangeFeed.read`, documented there.
   *
   * @throws TypeError for a position this driver did not write.
   */
  async read(
    after: string | undefined,
    models: readonly string[],
    limit: number,
  ): Promise<readonly ChangeRecord[]> {
    if (models.length === 0) return [];
    const from = after === undefined ? undefined : parsePosition(after);
    // raw-sql: the snapshot horizon (pg_snapshot_xmin) and the (tx, seq) row comparison have no ORM form; all bound
    const rows = await this.database
      .em()
      .execute(
        "select tx::text as tx, seq, data, meta, occurred_at, scope_id, scope_path::text as scope_path " +
          `from ${TABLE} where tx < pg_snapshot_xmin(pg_current_snapshot()) ` +
          "and type in (select jsonb_array_elements_text(?::jsonb)) " +
          (from === undefined ? "" : "and (tx, seq) > (?::xid8, ?::bigint) ") +
          "order by tx, seq limit ?",
        [JSON.stringify(models), ...(from ?? []), limit],
      );
    return z.array(ROW).parse(rows).map(recordOf);
  }

  /** Implements `ChangeFeed.positionAt`, documented there: just before the first entry at or after `at`. */
  async positionAt(at: Date): Promise<string | undefined> {
    const em = this.database.em();
    // raw-sql: the first entry at or after `at`, in log order; the instant is bound
    const [first] = AT.parse(
      await em.execute(
        `select tx::text as tx, seq from ${TABLE} where occurred_at >= ? order by tx, seq limit 1`,
        [at],
      ),
    );
    if (first !== undefined) return `${first.tx}:${BigInt(first.seq) - 1n}`;
    // raw-sql: nothing since `at`: the cursor starts after the last entry
    const [last] = AT.parse(
      await em.execute(
        `select tx::text as tx, seq from ${TABLE} order by tx desc, seq desc limit 1`,
      ),
    );
    return last === undefined ? undefined : `${last.tx}:${last.seq}`;
  }

  /** Implements `ChangeFeed.cursor`, documented there. */
  async cursor(consumer: string): Promise<ChangeCursor | undefined> {
    // raw-sql: the cursors have no model; one parameterised read
    const [row] = z
      .array(CURSOR)
      .parse(
        await this.database
          .em()
          .execute(
            `select consumer, position, attempts, available_at, last_error, stalled_at from ${CURSORS} where consumer = ?`,
            [consumer],
          ),
      );
    if (row === undefined) return undefined;
    return Object.freeze({
      consumer: row.consumer,
      ...(row.position === null ? {} : { position: row.position }),
      attempts: row.attempts,
      availableAt: row.available_at,
      ...(row.last_error === null ? {} : { lastError: row.last_error }),
      ...(row.stalled_at === null ? {} : { stalledAt: row.stalled_at }),
    });
  }

  /** Implements `ChangeFeed.save`, documented there. */
  async save(cursor: ChangeCursor): Promise<void> {
    // raw-sql: an upsert by consumer; every value bound
    await this.database
      .em()
      .execute(
        `insert into ${CURSORS} (consumer, position, attempts, available_at, last_error, stalled_at) ` +
          "values (?, ?, ?, ?, ?::jsonb, ?) on conflict (consumer) do update set position = excluded.position, " +
          "attempts = excluded.attempts, available_at = excluded.available_at, last_error = excluded.last_error, " +
          "stalled_at = excluded.stalled_at",
        [
          cursor.consumer,
          cursor.position ?? null,
          cursor.attempts,
          cursor.availableAt,
          cursor.lastError === undefined ? null : JSON.stringify(cursor.lastError),
          cursor.stalledAt ?? null,
        ],
      );
  }

  /** Implements `ChangeFeed.maintain`, documented there. */
  async maintain(now: Date, retain: Duration): Promise<ChangeLogReport> {
    const em = this.database.em();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    let created = 0;
    for (let offset = 1; offset <= PREMAKE_DAYS; offset += 1) {
      const start = new Date(today + offset * DAY);
      const name = `changes_p${stamp(start)}`;
      // raw-sql: the catalog says whether the partition exists; the name is bound
      const [exists] = z
        .array(z.object({ missing: z.boolean() }))
        .parse(await em.execute("select to_regclass(?) is null as missing", [`outbox.${name}`]));
      if (exists?.missing !== true) continue;
      // raw-sql: partition DDL has no ORM form; the name and bounds are computed here from the clock, never input
      await em.execute(
        `create table if not exists outbox.${name} partition of ${TABLE} for values from ('${start.toISOString()}') to ('${new Date(start.getTime() + DAY).toISOString()}')`,
      );
      created += 1;
    }
    const cutoff = new Date(now.getTime() - Duration.toMilliseconds(retain));
    // raw-sql: the catalog lists the log's partitions
    const children = z
      .array(z.object({ name: z.string() }))
      .parse(
        await em.execute(
          "select c.relname as name from pg_inherits i join pg_class c on c.oid = i.inhrelid " +
            "join pg_class p on p.oid = i.inhparent join pg_namespace n on n.oid = p.relnamespace " +
            "where n.nspname = 'outbox' and p.relname = 'changes'",
        ),
      );
    let dropped = 0;
    for (const { name } of children) {
      const match = DATED.exec(name);
      if (match === null) continue;
      const end = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + DAY;
      if (end > cutoff.getTime()) continue;
      // raw-sql: detaching then dropping a whole expired partition is the retention step; the name matched DATED
      await em.execute(`alter table ${TABLE} detach partition outbox.${name}`);
      await em.execute(`drop table outbox.${name}`);
      dropped += 1;
    }
    // raw-sql: rows written before their day's partition existed sit in the default partition; the cutoff is bound
    await em.execute("delete from outbox.changes_default where occurred_at < ?", [cutoff]);
    return { created, dropped };
  }
}
