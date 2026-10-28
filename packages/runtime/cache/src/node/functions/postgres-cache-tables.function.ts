/**
 * Stackra file contract:
 * Purpose: `postgresCacheTables`, the statements that create the two unlogged tables the `postgres` cache driver keeps
 *          in a schema: `entries` (one row per namespaced key: the entry's JSON text and the instant the row may go)
 *          and `set_members` (the keys carrying each tag), each with the index its sweep reads.
 * Boundary: the shape the driver's statements expect, for the migration that creates it (a migration is a frozen
 *           snapshot, so it copies these statements as literals, with `schema.sql(statement, { inverse })`). Unlogged:
 *           the tables skip the WAL, so writes are cheap, a crash empties them and replicas do not see them, which a
 *           cache allows. Keys sort in the "C" collation, so a prefix `like` uses the primary key. No row-level
 *           security: every key already carries its namespace.
 * Runtime: node
 * Governing contract: ADR 0150 (decision 1); ADR 0159 (migrations; raw statements carry their inverse); ADR 0160.
 */

/**
 * The create statements, each with its inverse, for the tables in `schema`.
 *
 * @example
 * for (const { statement, inverse } of postgresCacheTables("cache")) schema.sql(statement, { inverse });
 */
export function postgresCacheTables(
  schema: string,
): readonly { readonly statement: string; readonly inverse: string }[] {
  const entries = `"${schema}"."entries"`;
  const members = `"${schema}"."set_members"`;
  return [
    {
      statement:
        `create unlogged table ${entries} (` +
        'key text collate "C" primary key, body text not null, expires_at timestamptz not null)',
      inverse: `drop table ${entries}`,
    },
    {
      statement: `create index "idx_entries_expires_at" on ${entries} (expires_at)`,
      inverse: `drop index "${schema}"."idx_entries_expires_at"`,
    },
    {
      statement:
        `create unlogged table ${members} (` +
        'set_name text collate "C" not null, member text collate "C" not null, ' +
        "expires_at timestamptz not null, primary key (set_name, member))",
      inverse: `drop table ${members}`,
    },
    {
      statement: `create index "idx_set_members_expires_at" on ${members} (expires_at)`,
      inverse: `drop index "${schema}"."idx_set_members_expires_at"`,
    },
  ];
}
