/**
 * Stackra file contract:
 * Purpose: the fifth migration of the database package (`database.0005_create_cache_tables`): the two unlogged tables
 *          behind the `postgres` driver of `@stackra/cache`, in that member's default schema `cache`: `entries` (one
 *          row per namespaced key: the entry's JSON text and the instant the row may go) and `set_members` (the keys
 *          carrying each tag), each with the index its sweep reads.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           statement is a literal with its inverse, copied from `postgresCacheTables("cache")` (@stackra/cache). It
 *           lives here because @stackra/cache cannot depend on this package (this package depends on it), as the
 *           action store tables of 0002 do. Raw DDL because the blueprint has no unlogged table and no "C"
 *           collation. Every statement is `if not exists`, so it adopts tables a service already made from
 *           `postgresCacheTables("cache")` (same shape) and keeps their rows. Platform tables, not tenant-owned: no
 *           `tenant_id` and no row-level security (ADR 0210 as amended 2026-10-24: global by design). A row is a
 *           derived copy that a crash may empty; its key already starts with the `CacheNamespace` prefix (the scope
 *           namespace keys each scope apart), and the driver runs each statement outside the caller's transaction,
 *           where no `app.*` setting is set, so a policy would hide every row. No `down()`: the inverses are stated.
 * Runtime: node
 * Governing contract: ADR 0150 (decision 1: the Postgres cache driver); ADR 0159 (as amended); ADR 0210 (2026-10-24
 *                     amendment); ADR 0160 (raw SQL).
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the cache schema, its two unlogged tables and their sweep indexes. */
export class CreateCacheTablesMigration extends Migration {
  /** The tables, each statement with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql('create schema if not exists "cache"', {
      inverse: 'drop schema if exists "cache"',
    });
    schema.sql(
      'create unlogged table if not exists "cache"."entries" (' +
        'key text collate "C" primary key, body text not null, expires_at timestamptz not null)',
      { inverse: 'drop table if exists "cache"."entries"' },
    );
    schema.sql(
      'create index if not exists "idx_entries_expires_at" on "cache"."entries" (expires_at)',
      { inverse: 'drop index if exists "cache"."idx_entries_expires_at"' },
    );
    schema.sql(
      'create unlogged table if not exists "cache"."set_members" (' +
        'set_name text collate "C" not null, member text collate "C" not null, ' +
        "expires_at timestamptz not null, primary key (set_name, member))",
      { inverse: 'drop table if exists "cache"."set_members"' },
    );
    schema.sql(
      'create index if not exists "idx_set_members_expires_at" on "cache"."set_members" (expires_at)',
      { inverse: 'drop index if exists "cache"."idx_set_members_expires_at"' },
    );
    schema.sql(
      `comment on table "cache"."entries" is 'Platform cache entries of the postgres cache driver: keyed by namespace, no tenant column, no row-level security.'`,
      { inverse: 'comment on table "cache"."entries" is null' },
    );
    schema.sql(
      `comment on table "cache"."set_members" is 'Platform cache tag members of the postgres cache driver: keyed by namespace, no tenant column, no row-level security.'`,
      { inverse: 'comment on table "cache"."set_members" is null' },
    );
  }
}
