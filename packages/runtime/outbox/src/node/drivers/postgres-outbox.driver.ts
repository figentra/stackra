/**
 * Stackra file contract:
 * Purpose: `PostgresOutboxDriver`, the server's `OutboxDriver`: messages are rows of `outbox.messages`, written in the
 *          caller's transaction with the transaction's scope, listed for the relay oldest first, deleted once
 *          delivered, counted, rescheduled or dead-lettered when a delivery fails, pruned once long dead, and found
 *          and rewritten by an erased subject's id (stackra-275).
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
import { holdsValue } from "#core/functions/holds-value.function";
import { STORED_MESSAGE_COLUMNS } from "#node/constants/stored-message-columns.constant";
import { insertMessages } from "#node/functions/insert-messages.function";
import { scopeOfRow } from "#node/functions/scope-of-row.function";

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
  ...STORED_MESSAGE_COLUMNS,
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
    ...scopeOfRow(row),
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

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `OutboxDriver.write`, documented there. */
  write(messages: readonly OutboxMessage[]): Promise<void> {
    return insertMessages(this.database.em(), messages);
  }

  /** Implements `OutboxDriver.due`, documented there. */
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

  /** Implements `OutboxDriver.remove`, documented there. */
  async remove(id: PublicId<"evt">): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised delete
    await this.database.em().execute(`delete from ${TABLE} where id = ?`, [id]);
  }

  /** Implements `OutboxDriver.retry`, documented there. */
  async retry(id: PublicId<"evt">, availableAt: Date, error: OutboxError): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set attempts = attempts + 1, available_at = ?, last_error = ?::jsonb where id = ?`,
        [availableAt, JSON.stringify(error), id],
      );
  }

  /** Implements `OutboxDriver.pruneDead`, documented there. */
  async pruneDead(before: Date): Promise<number> {
    // raw-sql: the outbox has no model; one parameterised delete of old dead letters, counted by `returning`
    const rows = await this.database
      .em()
      .execute(`delete from ${TABLE} where dead_at is not null and dead_at < ? returning id`, [
        before,
      ]);
    return Array.isArray(rows) ? rows.length : 0;
  }

  /** Implements `OutboxDriver.holding`, documented there. */
  async holding(value: string): Promise<readonly OutboxMessage[]> {
    // raw-sql: the outbox has no model; the jsonb text holds the value as a JSON string, so position() narrows the
    // scan without a jsonpath (whose `?` would clash with the bindings), and the walk below drops a key that matched
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from ${TABLE} where position(? in data::text) > 0 order by occurred_at, id`,
        [JSON.stringify(value)],
      );
    return ROWS.parse(rows)
      .map(messageOf)
      .filter((message) => holdsValue(message.data, value));
  }

  /** Implements `OutboxDriver.rewrite`, documented there. */
  async rewrite(id: PublicId<"evt">, data: unknown): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised update of the payload
    await this.database
      .em()
      .execute(`update ${TABLE} set data = ?::jsonb where id = ?`, [
        JSON.stringify(data ?? null),
        id,
      ]);
  }

  /** Implements `OutboxDriver.deadLetter`, documented there. */
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
