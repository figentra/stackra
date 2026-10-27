/**
 * Stackra file contract:
 * Purpose: `PostgresInboxDriver`, the server's `InboxDriver`: received event ids are rows of `outbox.inbox`; a claim is
 *          one insert that does nothing on a known id, so two deliveries of one event racing each other claim it once.
 * Boundary: raw SQL on the running context's entity manager, so a claim joins the transaction its listeners run in and
 *           is released if that transaction rolls back. Every value is bound and the result read through zod. Event
 *           ids are unique per occurrence, so the table is keyed by id alone and carries no scope or policy.
 * Runtime: node
 * Governing contract: ADR 0078 (decision 4: inbox deduplication by event id); ADR 0160; ADR 0142; ADR 0294
 *                     (decision 16).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";
import { z } from "zod";

import { InboxDriver } from "#contracts/index";

/** The inbox table, in the package's schema. */
const TABLE = '"outbox"."inbox"';

/** Rows that carry only the event id. */
const IDS = z.array(z.object({ event_id: z.string() }));

/**
 * Keeps received event ids in Postgres.
 *
 * @example
 * // generated wiring: { port: InboxDriver, selectedBy: "config:outbox.driver", candidates: { postgres: … } }
 */
export class PostgresInboxDriver extends Driver(InboxDriver) {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `InboxDriver.claim`, documented there. */
  async claim(eventId: string, at: Date): Promise<boolean> {
    // raw-sql: the claim is decided by the primary key's conflict, which the ORM's insert cannot target
    const rows = await this.database
      .em()
      .execute(
        `insert into ${TABLE} (event_id, received_at) values (?, ?) ` +
          "on conflict (event_id) do nothing returning event_id",
        [eventId, at],
      );
    return IDS.parse(rows).length > 0;
  }

  /** Implements `InboxDriver.prune`, documented there. */
  async prune(before: Date): Promise<void> {
    // raw-sql: the inbox has no model; one parameterised delete
    await this.database.em().execute(`delete from ${TABLE} where received_at < ?`, [before]);
  }
}
