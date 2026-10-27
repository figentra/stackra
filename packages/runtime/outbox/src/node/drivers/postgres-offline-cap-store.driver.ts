/**
 * Stackra file contract:
 * Purpose: `PostgresOfflineCapStoreDriver`, the durable `OfflineCapStore` of @stackra/actions: each applied call of a
 *          capped action by a device is a row of `outbox.offline_cap_uses`; `usage` sums the calls inside the window
 *          and deletes the device's older ones for that action, which can never count again.
 * Boundary: raw SQL on the running context's entity manager, every value bound and every row read through zod; inside
 *           the pipeline's unit of work a recorded call commits with the call's writes. Amounts are minor units.
 * Runtime: node
 * Governing contract: ADR 0338 (decision 5: caps per action, reconciled on sync); ADR 0160; ADR 0142.
 */
import { OfflineCapStore } from "@stackra/actions/contracts";
import type { OfflineCapUsage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";
import { z } from "zod";

/** The table, in the package's schema. */
const TABLE = "outbox.offline_cap_uses";

/** The one row a usage read answers. */
const USAGE = z.array(z.object({ count: z.coerce.number().int(), amount: z.coerce.number() }));

/**
 * Counts capped calls in Postgres.
 *
 * @example
 * // generated wiring: { port: OfflineCapStore, candidates: { postgres: … } }
 */
export class PostgresOfflineCapStoreDriver extends Driver(OfflineCapStore) {
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** See `OfflineCapStore.usage`. */
  async usage(deviceId: string, key: string, since: Date): Promise<OfflineCapUsage> {
    const em = this.database.em();
    // raw-sql: the calls older than the window can never count again; one parameterised delete
    await em.execute(
      `delete from ${TABLE} where device_id = ? and action_key = ? and used_at < ?`,
      [deviceId, key, since],
    );
    // raw-sql: an aggregate over the window, which the ORM's find cannot return
    const rows = await em.execute(
      `select count(*) as count, coalesce(sum(amount), 0) as amount from ${TABLE} ` +
        "where device_id = ? and action_key = ? and used_at >= ?",
      [deviceId, key, since],
    );
    const [row] = USAGE.parse(rows);
    return { count: row?.count ?? 0, amount: row?.amount ?? 0 };
  }

  /** See `OfflineCapStore.record`. */
  async record(deviceId: string, key: string, at: Date, amount: number): Promise<void> {
    // raw-sql: the table has no model; one parameterised insert
    await this.database
      .em()
      .execute(
        `insert into ${TABLE} (device_id, action_key, used_at, amount) values (?, ?, ?, ?)`,
        [deviceId, key, at, amount],
      );
  }
}
