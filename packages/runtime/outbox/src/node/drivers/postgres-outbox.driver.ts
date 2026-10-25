/**
 * Stackra file contract:
 * Purpose: `PostgresOutboxDriver`, the server's `OutboxDriver`: messages are rows of `outbox.messages`, written in the
 *          caller's transaction with the transaction's scope, listed for the relay oldest first, deleted once
 *          delivered, and counted, rescheduled or dead-lettered when a delivery fails.
 * Boundary: raw SQL on the running context's entity manager, one statement per method, every value a bound parameter
 *           and every result row read through zod. The table is the service's outbox, read by the relay across scopes
 *           (it opens each message's scope itself), so it has no row-level-security policy. Payload, metadata and last
 *           error are `jsonb`; the scope path is `ltree`, read back as text.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4); ADR 0160 (raw SQL is parameterised and typed with zod); ADR 0142 (drivers
 *                     behind ports); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { MessageKind, OutboxDriver } from "#contracts/index";
import type { OutboxError, OutboxMessage } from "#contracts/index";
import { insertMessages } from "#node/functions/insert-messages.function";

/** The message table, in the package's schema. */
const TABLE = '"outbox"."messages"';

/** The columns a message is read from. */
const COLUMNS =
  "id, kind, type, data, meta, occurred_at, scope_id, scope_path::text as scope_path, attempts, available_at, " +
  "last_error, dead_at";

/** One row of `outbox.messages`. */
const ROW = z.object({
  id: z.string().startsWith("evt_"),
  kind: z.enum(Enum.values(MessageKind) as [MessageKind, ...MessageKind[]]),
  type: z.string(),
  data: z.unknown(),
  meta: z.record(z.string(), z.unknown()),
  occurred_at: z.coerce.date(),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
  attempts: z.number().int(),
  available_at: z.coerce.date(),
  last_error: z.object({ code: z.string(), message: z.string() }).nullable(),
  dead_at: z.coerce.date().nullable(),
});

/** Rows of `outbox.messages`. */
const ROWS = z.array(ROW);

/** The message of one row. */
function messageOf(row: z.infer<typeof ROW>): OutboxMessage {
  return Object.freeze({
    id: row.id as PublicId<"evt">,
    kind: row.kind,
    type: row.type,
    data: row.data,
    meta: row.meta as OutboxMessage["meta"],
    occurredAt: row.occurred_at,
    ...(row.scope_id === null || row.scope_path === null
      ? {}
      : { scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path } }),
    attempts: row.attempts,
    availableAt: row.available_at,
    ...(row.last_error === null ? {} : { lastError: row.last_error }),
    ...(row.dead_at === null ? {} : { deadAt: row.dead_at }),
  });
}

/**
 * Keeps outbox messages in Postgres.
 *
 * @example
 * // generated wiring: { port: OutboxDriver, selectedBy: "config:outbox.driver", candidates: { postgres: … } }
 */
export class PostgresOutboxDriver extends Driver(OutboxDriver) {
  /** The connected database. */
  private readonly database: Database;

  /** @param database - the connected database whose running transaction each statement joins. */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** See `OutboxDriver.write`. */
  write(messages: readonly OutboxMessage[]): Promise<void> {
    return insertMessages(this.database.em(), messages);
  }

  /** See `OutboxDriver.due`. */
  async due(now: Date, limit: number): Promise<readonly OutboxMessage[]> {
    // raw-sql: the outbox has no model; the relay reads across scopes, ordered by time then id
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from ${TABLE} where dead_at is null and available_at <= ? ` +
          "order by occurred_at, id limit ?",
        [now, limit],
      );
    return ROWS.parse(rows).map(messageOf);
  }

  /** See `OutboxDriver.remove`. */
  async remove(id: PublicId<"evt">): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised delete
    await this.database.em().execute(`delete from ${TABLE} where id = ?`, [id]);
  }

  /** See `OutboxDriver.retry`. */
  async retry(id: PublicId<"evt">, availableAt: Date, error: OutboxError): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set attempts = attempts + 1, available_at = ?, last_error = ?::jsonb where id = ?`,
        [availableAt, JSON.stringify(error), id],
      );
  }

  /** See `OutboxDriver.deadLetter`. */
  async deadLetter(id: PublicId<"evt">, error: OutboxError, at: Date): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set attempts = attempts + 1, dead_at = ?, last_error = ?::jsonb where id = ?`,
        [at, JSON.stringify(error), id],
      );
  }
}
