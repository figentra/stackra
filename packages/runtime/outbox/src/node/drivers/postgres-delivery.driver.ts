/**
 * Stackra file contract:
 * Purpose: `PostgresDeliveryDriver`, the server's `DeliveryDriver`: cross-app deliveries are rows of
 *          `outbox.deliveries`, written once per event, subscriber and wire name, listed for the relay fairly across
 *          subscribers, deleted once delivered, counted, rescheduled or dead-lettered when an attempt fails, listed by
 *          state for an operator, replayed and pruned once long dead.
 * Boundary: raw SQL on the running context's entity manager, one statement per method, every value a bound parameter
 *           and every result row read through zod. The table is the producer's operational table, read by the relay
 *           across scopes, so it has no row-level-security policy. Envelope and last error are `jsonb`. It never
 *           delivers, computes a backoff or reads a clock: the relay passes `now` and the retry time.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4); ADR 0160 (raw SQL is parameterised and
 *                     typed with zod); ADR 0142 (drivers behind ports); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { DeliveryDriver } from "#contracts/index";
import type { CrossAppEnvelope, Delivery, OutboxError } from "#contracts/index";

/** The delivery table, in the package's schema. */
const TABLE = '"outbox"."deliveries"';

/** The columns a delivery is read from. */
const COLUMNS = "id, subscriber, envelope, attempts, available_at, created_at, last_error, dead_at";

/** The envelope as stored: the fields every consumer reads, and whatever else it was sent with (`scope`). */
const ENVELOPE = z.looseObject({
  id: z.string(),
  type: z.string(),
  occurredAt: z.string(),
  envelopeVersion: z.literal(1),
  meta: z.record(z.string(), z.unknown()),
  data: z.unknown(),
});

/** One row of `outbox.deliveries`. */
const ROW = z.object({
  id: z.string().startsWith("dlv_"),
  subscriber: z.string(),
  envelope: ENVELOPE,
  attempts: z.number().int(),
  available_at: z.coerce.date(),
  created_at: z.coerce.date(),
  last_error: z.object({ code: z.string(), message: z.string() }).nullable(),
  dead_at: z.coerce.date().nullable(),
});

/** Rows of `outbox.deliveries`. */
const ROWS = z.array(ROW);

/** The ids of rows a statement returned. */
const IDS = z.array(z.object({ id: z.string() }));

/** The delivery of one row. */
function deliveryOf(row: z.infer<typeof ROW>): Delivery {
  return Object.freeze({
    id: row.id as PublicId<"dlv">,
    subscriber: row.subscriber,
    envelope: row.envelope as CrossAppEnvelope,
    attempts: row.attempts,
    availableAt: row.available_at,
    createdAt: row.created_at,
    ...(row.last_error === null ? {} : { lastError: row.last_error }),
    ...(row.dead_at === null ? {} : { deadAt: row.dead_at }),
  });
}

/**
 * Keeps cross-app deliveries in Postgres.
 *
 * @example
 * // generated wiring: { port: DeliveryDriver, selectedBy: "config:outbox.driver", candidates: { postgres: … } }
 */
export class PostgresDeliveryDriver extends Driver(DeliveryDriver) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `DeliveryDriver.write`, documented there. */
  async write(deliveries: readonly Delivery[]): Promise<void> {
    if (deliveries.length === 0) return;
    const rows = deliveries.map((delivery) => ({
      id: delivery.id,
      event_id: delivery.envelope.id,
      subscriber: delivery.subscriber,
      type: delivery.envelope.type,
      envelope: delivery.envelope,
      attempts: delivery.attempts,
      available_at: delivery.availableAt,
      created_at: delivery.createdAt,
      last_error: delivery.lastError ?? null,
      dead_at: delivery.deadAt ?? null,
    }));
    // raw-sql: the outbox has no model; one statement per batch, and a delivery already stored under its event id,
    // subscriber and wire name is skipped by the unique key, so a relay that writes again writes each once
    await this.database
      .em()
      .execute(
        `insert into ${TABLE} (id, event_id, subscriber, type, envelope, attempts, available_at, created_at, ` +
          "last_error, dead_at) " +
          "select d.id, d.event_id, d.subscriber, d.type, d.envelope, d.attempts, d.available_at, d.created_at, " +
          "d.last_error, d.dead_at " +
          "from jsonb_to_recordset(?::jsonb) as d(id text, event_id text, subscriber text, type text, " +
          "envelope jsonb, attempts int, available_at timestamptz, created_at timestamptz, last_error jsonb, " +
          "dead_at timestamptz) " +
          "on conflict (event_id, subscriber, type) do nothing",
        [JSON.stringify(rows)],
      );
  }

  /** Implements `DeliveryDriver.due`, documented there. */
  async due(now: Date, limit: number): Promise<readonly Delivery[]> {
    // raw-sql: the outbox has no model; a window function ranks each subscriber's due deliveries oldest first, and the
    // outer order takes every subscriber's first before any subscriber's second, so a backlog crowds out no one
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from (` +
          `select ${COLUMNS}, row_number() over (partition by subscriber order by created_at, id) as turn ` +
          `from ${TABLE} where dead_at is null and available_at <= ?` +
          ") as ranked order by turn, created_at, id limit ?",
        [now, limit],
      );
    return ROWS.parse(rows).map(deliveryOf);
  }

  /** Implements `DeliveryDriver.remove`, documented there. */
  async remove(id: PublicId<"dlv">): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised delete
    await this.database.em().execute(`delete from ${TABLE} where id = ?`, [id]);
  }

  /** Implements `DeliveryDriver.retry`, documented there. */
  async retry(id: PublicId<"dlv">, availableAt: Date, error: OutboxError): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set attempts = attempts + 1, available_at = ?, last_error = ?::jsonb where id = ?`,
        [availableAt, JSON.stringify(error), id],
      );
  }

  /** Implements `DeliveryDriver.deadLetter`, documented there. */
  async deadLetter(id: PublicId<"dlv">, error: OutboxError, at: Date): Promise<void> {
    // raw-sql: the outbox has no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set attempts = attempts + 1, dead_at = ?, last_error = ?::jsonb where id = ?`,
        [at, JSON.stringify(error), id],
      );
  }

  /** Implements `DeliveryDriver.list`, documented there. */
  async list(filter: {
    readonly subscriber?: string;
    readonly state: "pending" | "failing" | "dead";
  }): Promise<readonly Delivery[]> {
    const state =
      filter.state === "dead"
        ? "dead_at is not null"
        : `dead_at is null and attempts ${filter.state === "pending" ? "= 0" : "> 0"}`;
    const subscriber = filter.subscriber === undefined ? "" : " and subscriber = ?";
    // raw-sql: the outbox has no model; the state is one of three fixed predicates, the subscriber is bound
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from ${TABLE} where ${state}${subscriber} order by created_at, id`,
        filter.subscriber === undefined ? [] : [filter.subscriber],
      );
    return ROWS.parse(rows).map(deliveryOf);
  }

  /** Implements `DeliveryDriver.replay`, documented there. */
  async replay(id: PublicId<"dlv">, at: Date): Promise<boolean> {
    // raw-sql: the outbox has no model; one parameterised update of a dead delivery, counted by `returning`
    const rows = await this.database
      .em()
      .execute(
        `update ${TABLE} set dead_at = null, attempts = 0, available_at = ?, last_error = null ` +
          "where id = ? and dead_at is not null returning id",
        [at, id],
      );
    return IDS.parse(rows).length > 0;
  }

  /** Implements `DeliveryDriver.pruneDead`, documented there. */
  async pruneDead(before: Date): Promise<number> {
    // raw-sql: the outbox has no model; one parameterised delete of old dead letters, counted by `returning`
    const rows = await this.database
      .em()
      .execute(`delete from ${TABLE} where dead_at is not null and dead_at < ? returning id`, [
        before,
      ]);
    return Array.isArray(rows) ? rows.length : 0;
  }
}
