/**
 * Stackra file contract:
 * Purpose: `PostgresDeviceSequenceStoreDriver`, the durable `DeviceSequenceStore` of @stackra/actions: each device's
 *          last settled sequence is a row of `outbox.device_sequences`, advanced only upward in one upsert.
 * Boundary: raw SQL on the running context's entity manager, every value bound and every row read through zod; inside
 *           the pipeline's unit of work each statement joins its transaction, so a sequence settles with the call's
 *           writes or not at all. The upsert's `where` keeps a lower or equal sequence from moving the row back, so two
 *           racing settles of one device end at the higher one.
 * Runtime: node
 * Governing contract: ADR 0338 (decisions 1 and 4: per-device order, the last acknowledged sequence); ADR 0160 (raw
 *                     SQL is parameterised and typed with zod); ADR 0142 (drivers behind ports).
 */
import { DeviceSequenceStore } from "@stackra/actions/contracts";
import type { DeviceSequence } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { z } from "zod";

/** The table, in the package's schema. */
const TABLE = "outbox.device_sequences";

/** Rows of `outbox.device_sequences`. */
const ROWS = z.array(
  z.object({
    device_id: z.string(),
    sequence: z.coerce.number().int().min(1),
    settled_at: z.coerce.date(),
    scope_id: z.string().nullable(),
    scope_path: z.string().nullable(),
  }),
);

/**
 * Keeps device sequences in Postgres.
 *
 * @example
 * // generated wiring: { port: DeviceSequenceStore, candidates: { postgres: … } }
 */
export class PostgresDeviceSequenceStoreDriver extends Driver(DeviceSequenceStore) {
  private readonly database: Database;

  /**
   * @param database - the connected database whose running transaction each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `DeviceSequenceStore.last`, documented there. */
  async last(deviceId: string): Promise<DeviceSequence | undefined> {
    // raw-sql: the table has no model; one read by key
    const rows = await this.database
      .em()
      .execute(
        `select device_id, sequence, settled_at, scope_id, scope_path::text as scope_path from ${TABLE} where device_id = ?`,
        [deviceId],
      );
    const [row] = ROWS.parse(rows);
    if (row === undefined) return undefined;
    return Object.freeze({
      deviceId: row.device_id,
      sequence: row.sequence,
      settledAt: row.settled_at,
      ...(row.scope_id === null || row.scope_path === null
        ? {}
        : { scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path } }),
    });
  }

  /** Implements `DeviceSequenceStore.settle`, documented there. */
  async settle(
    deviceId: string,
    sequence: number,
    at: Date,
    scope: ScopeRef | undefined,
  ): Promise<void> {
    // raw-sql: an upsert that only moves a device's sequence upward, which the ORM cannot express
    await this.database
      .em()
      .execute(
        `insert into ${TABLE} as current (device_id, sequence, settled_at, scope_id, scope_path) ` +
          "values (?, ?, ?, ?, ?::ltree) " +
          "on conflict (device_id) do update set sequence = excluded.sequence, settled_at = excluded.settled_at, " +
          "scope_id = excluded.scope_id, scope_path = excluded.scope_path " +
          "where current.sequence < excluded.sequence",
        [deviceId, sequence, at, scope?.id ?? null, scope?.path ?? null],
      );
  }
}
