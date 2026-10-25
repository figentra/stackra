/**
 * Stackra file contract:
 * Purpose: the third migration of the outbox package (`outbox.0003_create_offline_stores`): the server side of the
 *          offline queue: each device's last settled sequence (`device_sequences`), the applied calls of capped
 *          actions (`offline_cap_uses`) and the ordered change log of every replica partition (`replica_changes`),
 *          each change stamped with its record's scope so a scoped replica never reads another legal entity's record.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every statement is a
 *           literal with its inverse. Raw DDL because the blueprint has no `bigint` (sequences and positions outgrow
 *           32 bits). The tables carry no row-level security: the drivers bind the device id, the partition and the
 *           caller's scope path themselves. `scope_path` is `ltree` (the extension migration 0001 creates).
 * Runtime: node
 * Governing contract: ADR 0338 (decisions 1, 3 and 5); ADR 0343 (decision 4: the legal entity is the transfer
 *                     boundary); ADR 0159 (as amended); ADR 0327 (scope paths).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the offline queue's three stores. */
export class CreateOfflineStoresMigration extends Migration {
  /** The three tables and their indexes, each with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql(
      "create table outbox.device_sequences (" +
        "device_id varchar(128) primary key, " +
        "sequence bigint not null check (sequence >= 1), " +
        "settled_at timestamptz not null, " +
        "scope_id varchar(64), " +
        "scope_path ltree)",
      { inverse: "drop table if exists outbox.device_sequences" },
    );
    schema.sql(
      "create table outbox.offline_cap_uses (" +
        "device_id varchar(128) not null, " +
        "action_key varchar(255) not null, " +
        "used_at timestamptz not null, " +
        "amount bigint not null default 0 check (amount >= 0))",
      { inverse: "drop table if exists outbox.offline_cap_uses" },
    );
    schema.sql(
      "create index idx_offline_cap_uses_device_action_used_at " +
        "on outbox.offline_cap_uses (device_id, action_key, used_at)",
      { inverse: "drop index if exists outbox.idx_offline_cap_uses_device_action_used_at" },
    );
    schema.sql(
      "create table outbox.replica_changes (" +
        "partition varchar(512) not null, " +
        "position bigint not null check (position >= 1), " +
        "record_id varchar(64) not null, " +
        "row jsonb, " +
        "scope_id varchar(64), " +
        "scope_path ltree, " +
        "primary key (partition, position))",
      { inverse: "drop table if exists outbox.replica_changes" },
    );
    schema.sql(
      "create index idx_replica_changes_scope_path on outbox.replica_changes using gist (scope_path)",
      { inverse: "drop index if exists outbox.idx_replica_changes_scope_path" },
    );
  }
}
