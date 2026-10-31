/**
 * Stackra file contract:
 * Purpose: the fourth migration of the outbox package (`outbox.0004_create_changes`): the retained change log
 *          (`outbox.changes`), range-partitioned by day on `occurred_at` with a default partition, and the per-consumer
 *          cursors (`outbox.change_cursors`) that replace delete-on-deliver for row changes.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every statement is a
 *           literal with its inverse. Raw DDL because the blueprint has no identity column and no `xid8`: `seq` orders
 *           entries within a transaction, `tx` (the writing transaction's id) lets the reader list only entries no
 *           running transaction can still precede. The dated partitions (`changes_p<yyyymmdd>`) are made and dropped by
 *           `ChangeFeed.maintain`. No row-level security: the relay reads across scopes and opens each entry's scope.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: the outbox change feed); ADR 0159 (as amended);
 *                     ADR 0327 (scope paths); data-layer gaps cdc1 and cdc6 (native partitioning, no extension).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the change log and its cursors. */
export class CreateChangesMigration extends Migration {
  /** The two tables, the default partition, the indexes and the column comments, each with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql(
      "create table outbox.changes (" +
        "seq bigint generated always as identity, " +
        "tx xid8 not null default pg_current_xact_id(), " +
        "type varchar(255) not null, " +
        "data jsonb not null, " +
        "meta jsonb not null default '{}', " +
        "occurred_at timestamptz not null, " +
        "scope_id varchar(64), " +
        "scope_path ltree, " +
        "primary key (seq, occurred_at)" +
        ") partition by range (occurred_at)",
      { inverse: "drop table if exists outbox.changes" },
    );
    schema.sql("create table outbox.changes_default partition of outbox.changes default", {
      inverse: "drop table if exists outbox.changes_default",
    });
    schema.sql("create index ix_changes_tx_seq on outbox.changes (tx, seq)", {
      inverse: "drop index if exists outbox.ix_changes_tx_seq",
    });
    schema.sql("create index ix_changes_occurred_at on outbox.changes using brin (occurred_at)", {
      inverse: "drop index if exists outbox.ix_changes_occurred_at",
    });
    for (const [column, text] of [
      ["seq", "The order of entries written by one transaction."],
      [
        "tx",
        "The writing transaction; entries are read in (tx, seq) order once no older one runs.",
      ],
      ["type", "The changed model's class name."],
      [
        "data",
        "The row change as JSON: model, id, kind, fields, and opt-in before and after values.",
      ],
      ["meta", "Who caused it, and the ids that chain it to its call."],
      ["occurred_at", "When the write happened; the partition key."],
      ["scope_id", "The scope node of the transaction that wrote the change."],
      ["scope_path", "That node's path, from the transaction's scope settings."],
    ] as const)
      schema.sql(`comment on column outbox.changes.${column} is '${text.replaceAll("'", "''")}'`, {
        inverse: false,
      });
    schema.sql(
      "create table outbox.change_cursors (" +
        "consumer varchar(255) primary key, " +
        "position varchar(64), " +
        "attempts integer not null default 0, " +
        "available_at timestamptz not null, " +
        "last_error jsonb, " +
        "stalled_at timestamptz)",
      { inverse: "drop table if exists outbox.change_cursors" },
    );
    for (const [column, text] of [
      ["consumer", "The change consumer class's name."],
      ["position", "The position of the last change it handled; null reads from the log's start."],
      ["attempts", "Failed deliveries since its last success."],
      ["available_at", "When it is next due."],
      ["last_error", "The code and message of its last failed delivery."],
      ["stalled_at", "When it stalled after its last attempt, until resumed or replayed."],
    ] as const)
      schema.sql(
        `comment on column outbox.change_cursors.${column} is '${text.replaceAll("'", "''")}'`,
        {
          inverse: false,
        },
      );
  }
}
