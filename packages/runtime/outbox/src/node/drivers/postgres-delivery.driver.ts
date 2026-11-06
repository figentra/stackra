/**
 * Stackra file contract:
 * Purpose: `PostgresDeliveryDriver`, the server's `DeliveryDriver`: cross-app deliveries are rows of
 *          `outbox.deliveries`, written insert-or-ignore on (event id, subscriber, type), listed for the relay up to a
 *          limit per subscriber, deleted once delivered, counted, rescheduled or dead-lettered when an attempt fails,
 *          listed per subscriber and state for an operator, and replayed once dead.
 * Boundary: raw SQL on the running context's entity manager, one statement per method, every value a bound parameter
 *           and every result row read through zod. The table is the producer's operational table, read across scopes,
 *           so it has no row-level-security policy. Envelope and last error are `jsonb`.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); ADR 0160 (raw SQL is parameterised and
 *                     typed with zod); ADR 0142 (drivers behind ports).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { DeliveryDriver, DeliveryState } from "#contracts/index";
import type { CrossAppEnvelope, Delivery, DeliveryError } from "#contracts/index";

/** The delivery table, in the package's schema. */
const TABLE = '"outbox"."deliveries"';

/** The columns a delivery is read from. */
const COLUMNS =
  "id, event_id, subscriber, type, envelope, attempts, available_at, last_error, dead_at, created_at";

/** The SQL condition of each state, on `attempts` and `dead_at`. */
const STATE_WHERE: Readonly<Record<DeliveryState, string>> = Object.freeze({
  [DeliveryState.Pending]: "dead_at is null and attempts = 0",
  [DeliveryState.Failing]: "dead_at is null and attempts > 0",
  [DeliveryState.Dead]: "dead_at is not null",
});

/** One row of `outbox.deliveries`. */
const ROW = z.object({
  id: z.string().startsWith("dlv_"),
  event_id: z.string(),
  subscriber: z.string(),
  type: z.string(),
  envelope: z.record(z.string(), z.unknown()),
  attempts: z.number().int(),
  available_at: z.coerce.date(),
  last_error: z.object({ code: z.string(), status: z.number().int().optional() }).nullable(),
  dead_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});

/** Rows of `outbox.deliveries`. */
const ROWS = z.array(ROW);

/** The delivery of one row. */
function deliveryOf(row: z.infer<typeof ROW>): Delivery {
  return Object.freeze({
    id: row.id as PublicId<"dlv">,
    eventId: row.event_id,
    subscriber: row.subscriber,
    type: row.type,
    envelope: row.envelope as unknown as CrossAppEnvelope,
    attempts: row.attempts,
    availableAt: row.available_at,
    ...(row.last_error === null ? {} : { lastError: row.last_error as DeliveryError }),
    ...(row.dead_at === null ? {} : { deadAt: row.dead_at }),
    createdAt: row.created_at,
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
      event_id: delivery.eventId,
      subscriber: delivery.subscriber,
      type: delivery.type,
      envelope: delivery.envelope,
      available_at: delivery.availableAt,
      created_at: delivery.createdAt,
    }));
    // raw-sql: the deliveries have no model; one statement per batch, a kept (event, subscriber, type) is skipped
    await this.database
      .em()
      .execute(
        `insert into ${TABLE} (id, event_id, subscriber, type, envelope, attempts, available_at, created_at) ` +
          "select d.id, d.event_id, d.subscriber, d.type, d.envelope, 0, d.available_at, d.created_at " +
          "from jsonb_to_recordset(?::jsonb) as d(id text, event_id text, subscriber text, type text, " +
          "envelope jsonb, available_at timestamptz, created_at timestamptz) " +
          "on conflict (event_id, subscriber, type) do nothing",
        [JSON.stringify(rows)],
      );
  }

  /** Implements `DeliveryDriver.due`, documented there. */
  async due(now: Date, limit: number): Promise<readonly Delivery[]> {
    // raw-sql: the deliveries have no model; a window ranks each subscriber's due rows so each takes at most `limit`
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from (select ${COLUMNS}, row_number() over ` +
          "(partition by subscriber order by created_at, id) as rank " +
          `from ${TABLE} where dead_at is null and available_at <= ?) as due ` +
          "where rank <= ? order by subscriber, created_at, id",
        [now, limit],
      );
    return ROWS.parse(rows).map(deliveryOf);
  }

  /** Implements `DeliveryDriver.remove`, documented there. */
  async remove(id: PublicId<"dlv">): Promise<void> {
    // raw-sql: the deliveries have no model; one parameterised delete
    await this.database.em().execute(`delete from ${TABLE} where id = ?`, [id]);
  }

  /** Implements `DeliveryDriver.retry`, documented there. */
  async retry(id: PublicId<"dlv">, availableAt: Date, error: DeliveryError): Promise<void> {
    // raw-sql: the deliveries have no model; one parameterised update per outcome
    await this.database
      .em()
      .execute(
        `update ${TABLE} set attempts = attempts + 1, available_at = ?, last_error = ?::jsonb where id = ?`,
        [availableAt, JSON.stringify(error), id],
      );
  }

  /** Implements `DeliveryDriver.deadLetter`, documented there. */
  async deadLetter(id: PublicId<"dlv">, error: DeliveryError, at: Date): Promise<void> {
    // raw-sql: the deliveries have no model; one parameterised update per outcome
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
    readonly state?: DeliveryState;
    readonly limit: number;
  }): Promise<readonly Delivery[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.subscriber !== undefined) {
      where.push("subscriber = ?");
      params.push(filter.subscriber);
    }
    if (filter.state !== undefined) where.push(STATE_WHERE[filter.state]);
    // raw-sql: the deliveries have no model; the conditions are fixed text, every value bound
    const rows = await this.database
      .em()
      .execute(
        `select ${COLUMNS} from ${TABLE}` +
          (where.length === 0 ? "" : ` where ${where.join(" and ")}`) +
          " order by created_at, id limit ?",
        [...params, filter.limit],
      );
    return ROWS.parse(rows).map(deliveryOf);
  }

  /** Implements `DeliveryDriver.replay`, documented there. */
  async replay(id: PublicId<"dlv">, now: Date): Promise<boolean> {
    // raw-sql: the deliveries have no model; one parameterised update of a dead row, counted by `returning`
    const rows = await this.database
      .em()
      .execute(
        `update ${TABLE} set dead_at = null, attempts = 0, available_at = ? ` +
          "where id = ? and dead_at is not null returning id",
        [now, id],
      );
    return Array.isArray(rows) && rows.length > 0;
  }
}
