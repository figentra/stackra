/**
 * Stackra file contract:
 * Purpose: `PostgresDeliveryDriver`, the server's `DeliveryDriver`: cross-app deliveries are rows of
 *          `outbox.deliveries`, written insert-or-ignore on (event id, subscriber, type), leased to the relay up to a
 *          limit per subscriber in one statement, deleted once delivered, counted, rescheduled or dead-lettered when an attempt fails,
 *          listed per subscriber and state for an operator, and replayed once dead.
 * Boundary: raw SQL on the running context's entity manager, one statement per method, every value a bound parameter
 *           and every result row read through zod. The table is tenant-owned in the platform form (`outbox.0006`): the
 *           lease and the operator's list go through the system functions `outbox.lease_due_deliveries` and
 *           `outbox.list_deliveries`, which return ids, tenants, subscribers and states only; every other statement
 *           runs under the caller's row-level security, so a delivery is read or changed only in its tenant's
 *           isolation. `tenant_id` is never written here: its default takes the call's `app.tenant_id` (the relay
 *           fans out in the message's tenant). Envelope and last error are `jsonb`.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); ADR 0160 (raw SQL is parameterised and
 *                     typed with zod); ADR 0142 (drivers behind ports); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { DeliveryDriver, DeliveryState } from "#contracts/index";
import type { CrossAppEnvelope, Delivery, DeliveryClaim, DeliveryError } from "#contracts/index";

/** The delivery table, in the package's schema. */
const TABLE = '"outbox"."deliveries"';

/** The columns a delivery is read from. */
const COLUMNS =
  "id, event_id, subscriber, type, envelope, attempts, available_at, last_error, dead_at, created_at";

/** Rows of a claim function. */
const CLAIMS = z.array(
  z.object({
    id: z.string().startsWith("dlv_"),
    tenant_id: z.string().nullable(),
    subscriber: z.string(),
    attempts: z.number().int(),
    dead_at: z.coerce.date().nullable(),
  }),
);

/** The claims of `rows`, a claim function's result. */
function claimsOf(rows: unknown): DeliveryClaim[] {
  return CLAIMS.parse(rows).map((row) =>
    Object.freeze({
      id: row.id as PublicId<"dlv">,
      ...(row.tenant_id === null ? {} : { ownerId: row.tenant_id as PublicId<"scp"> }),
      subscriber: row.subscriber,
      state:
        row.dead_at !== null
          ? DeliveryState.Dead
          : row.attempts > 0
            ? DeliveryState.Failing
            : DeliveryState.Pending,
    }),
  );
}

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

  /** Implements `DeliveryDriver.lease`, documented there. */
  async lease(now: Date, limit: number, until: Date): Promise<readonly DeliveryClaim[]> {
    // raw-sql: the system function ranks each subscriber's due rows of every tenant, takes at most `limit` of each and
    // moves their due time to the lease's end; `returning` has no order, so the relay's order is set here
    return claimsOf(
      await this.database
        .em()
        .execute(
          "select l.id, l.tenant_id, l.subscriber, l.attempts, l.dead_at " +
            "from outbox.lease_due_deliveries(?::timestamptz, ?::integer, ?::timestamptz) as l " +
            "order by l.subscriber, l.created_at, l.id",
          [now, limit, until],
        ),
    );
  }

  /** Implements `DeliveryDriver.load`, documented there. */
  async load(id: PublicId<"dlv">): Promise<Delivery | undefined> {
    // raw-sql: the deliveries have no model; one parameterised read under the caller's row-level security
    const [row] = ROWS.parse(
      await this.database.em().execute(`select ${COLUMNS} from ${TABLE} where id = ?`, [id]),
    );
    return row === undefined ? undefined : deliveryOf(row);
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
    readonly id?: PublicId<"dlv">;
    readonly subscriber?: string;
    readonly state?: DeliveryState;
    readonly limit: number;
  }): Promise<readonly DeliveryClaim[]> {
    // raw-sql: the system function lists every tenant's deliveries (ids, tenants, subscribers, states); all bound
    return claimsOf(
      await this.database
        .em()
        .execute(
          "select id, tenant_id, subscriber, attempts, dead_at " +
            "from outbox.list_deliveries(?::varchar, ?::varchar, ?::text, ?::integer)",
          [filter.id ?? null, filter.subscriber ?? null, filter.state ?? null, filter.limit],
        ),
    );
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
