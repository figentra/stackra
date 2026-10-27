/**
 * Stackra file contract:
 * Purpose: `PostgresReplicaLogDriver`, the durable `ReplicaLog` of @stackra/actions: each replica partition's changes
 *          are rows of `outbox.replica_changes` at increasing positions, each stamped with its record's scope, and a
 *          read returns only the changes whose scope path is the caller's or below it (a legal entity's device never
 *          reads another legal entity's record).
 * Boundary: raw SQL on the running context's entity manager, every value bound and every row read through zod. An
 *           append takes a transaction-level advisory lock on the partition before it reads the head, so two appends
 *           never take one position; it runs in the producer's unit of work, so a change and its record commit
 *           together. A read below the oldest kept position (once a retention job prunes) or above the head answers
 *           `undefined`, and the client fills again. A change without a scope reaches only a caller without one.
 * Runtime: node
 * Governing contract: ADR 0338 (decision 3: incremental refresh by an opaque monotonic cursor, scoped replicas, as
 *                     amended with ADR 0347); ADR 0343 (decision 4); ADR 0160; ADR 0142.
 */
import { ReplicaLog } from "@stackra/actions/contracts";
import type { ReplicaChange, ReplicaRead } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Json, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

/** The table, in the package's schema. */
const TABLE = "outbox.replica_changes";

/** The head and the oldest kept position of a partition. */
const BOUNDS = z.array(z.object({ head: z.coerce.number().int(), first: z.coerce.number().int() }));

/** Rows of a read. */
const CHANGES = z.array(
  z.object({
    position: z.coerce.number().int(),
    record_id: z.string(),
    row: z
      .object({ id: z.string(), at: z.coerce.date(), data: z.custom<Json>(() => true) })
      .nullable(),
  }),
);

/**
 * Keeps replica changes in Postgres.
 *
 * @example
 * // generated wiring: { port: ReplicaLog, candidates: { postgres: … } }
 */
export class PostgresReplicaLogDriver extends Driver(ReplicaLog) {
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `ReplicaLog.append`, documented there. */
  async append(
    partition: string,
    changes: readonly ReplicaChange[],
    scope: ScopeRef | undefined,
  ): Promise<number> {
    const em = this.database.em();
    // raw-sql: serialises appends to one partition until the transaction ends (ADR 0149 d1's advisory locks)
    await em.execute("select pg_advisory_xact_lock(hashtextextended(?, 1))", [partition]);
    const head = await this.head(partition);
    if (changes.length === 0) return head;
    const rows = changes.map((change) => ({
      id: change.id,
      row:
        change.row === undefined
          ? null
          : { id: change.row.id, at: change.row.at.toISOString(), data: change.row.data },
    }));
    // raw-sql: every change in one insert, the batch bound as one JSON array and numbered in order
    await em.execute(
      `insert into ${TABLE} (partition, position, record_id, row, scope_id, scope_path) ` +
        "select ?, ? + e.n, e.value->>'id', e.value->'row', ?, ?::ltree " +
        "from jsonb_array_elements(?::jsonb) with ordinality as e(value, n)",
      [partition, head, scope?.id ?? null, scope?.path ?? null, JSON.stringify(rows)],
    );
    return head + changes.length;
  }

  /** Implements `ReplicaLog.head`, documented there. */
  async head(partition: string): Promise<number> {
    return (await this.bounds(partition)).head;
  }

  /** Implements `ReplicaLog.read`, documented there. */
  async read(
    partition: string,
    after: number,
    limit: number,
    within: ScopeRef | undefined,
  ): Promise<ReplicaRead | undefined> {
    const { head, first } = await this.bounds(partition);
    if (
      !Number.isSafeInteger(after) ||
      after < 0 ||
      after > head ||
      (head > 0 && after < first - 1)
    )
      return undefined;
    const filter = within === undefined ? "" : " and scope_path <@ ?::ltree";
    // raw-sql: a keyed range read with the scope-path containment ltree offers and the ORM does not
    const rows = await this.database
      .em()
      .execute(
        `select position, record_id, row from ${TABLE} where partition = ? and position > ?${filter} ` +
          "order by position limit ?",
        within === undefined ? [partition, after, limit] : [partition, after, within.path, limit],
      );
    const read = CHANGES.parse(rows);
    const changes: ReplicaChange[] = read.map((row) =>
      Object.freeze({
        id: row.record_id,
        ...(row.row === null
          ? {}
          : { row: { id: row.row.id, at: row.row.at, data: row.row.data } }),
      }),
    );
    const position = read.length < limit ? head : (read.at(-1)?.position ?? head);
    return { changes, position, more: position < head };
  }

  /** The partition's head and its oldest kept position (1 when it is empty). */
  private async bounds(
    partition: string,
  ): Promise<{ readonly head: number; readonly first: number }> {
    // raw-sql: two aggregates over one partition's key range
    const rows = await this.database
      .em()
      .execute(
        `select coalesce(max(position), 0) as head, coalesce(min(position), 1) as first from ${TABLE} where partition = ?`,
        [partition],
      );
    return BOUNDS.parse(rows)[0] ?? { head: 0, first: 1 };
  }
}
