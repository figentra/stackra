/**
 * Stackra file contract:
 * Purpose: `readMigratedSchema(files, schemas)`, replays compiled migration steps on an in-memory PGlite (the approved
 *          extensions loaded) and reads back the tables, columns, indexes and foreign keys of the given Postgres
 *          schemas, for `stackra db diff`.
 * Boundary: no connection string, no environment variable, no network: the database is created here and closed before
 *           the function returns. PGlite and pgvector are optional peers loaded on first call with `createRequire`
 *           (the way `requireTestPeer` does, since the CLI path must not import them at load); a missing PGlite throws
 *           an error that says how to install it, a missing pgvector only leaves `vector` unavailable. A step that
 *           fails throws an error naming its file. PostGIS (ADR 0314) loads like pgvector, from its optional PGlite
 *           bundle `@electric-sql/pglite-postgis`.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2: the compiled steps and their transaction header); ADR 0160 (approved
 *                     extensions); ADR 0282 (decision 3); STA-1808.
 */
import { createRequire } from "node:module";

import type { MigratedSchema } from "#node/types/migrated-schema.type";
import type { MigrationFile } from "#node/types/migration-file.type";

/** `require` rooted at this package, so the peers resolve as `@stackra/database` declares them. */
const nodeRequire = createRequire(import.meta.url);

/** The part of PGlite this function calls. */
interface Pglite {
  readonly exec: (sql: string) => Promise<unknown>;
  readonly query: <Row>(sql: string) => Promise<{ readonly rows: Row[] }>;
  readonly transaction: (
    work: (transaction: { readonly exec: (sql: string) => Promise<unknown> }) => Promise<unknown>,
  ) => Promise<unknown>;
  readonly close: () => Promise<void>;
}

/** A Postgres schema name as module keys are written; anything else is never interpolated. */
const SCHEMA_NAME = /^[a-z][a-z0-9_]*$/;

/** The contrib extensions of ADR 0160 that PGlite ships, by the name `create extension` takes. */
const CONTRIB = ["ltree", "pg_trgm", "citext", "pgcrypto"] as const;

/** The header of a step the runner applies outside a transaction. */
const NON_TRANSACTIONAL = "-- stackra:transactional=false";

/** Loads `name`; undefined when it is missing and optional, an error saying how to install it when required. */
function loadPeer<T>(name: string, required: boolean): T | undefined {
  try {
    return nodeRequire(name) as T;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "MODULE_NOT_FOUND" && code !== "ERR_MODULE_NOT_FOUND") throw error;
    if (!required) return undefined;
    throw new Error(
      `stackra db diff replays the migrations on PGlite and needs "${name}", which is not installed: add ` +
        "@electric-sql/pglite and @electric-sql/pglite-pgvector as devDependencies of this member with their `catalog:` entries.",
      { cause: error },
    );
  }
}

/** Splits a comma-joined column list; empty for none. */
const listOf = (joined: string): string[] => (joined === "" ? [] : joined.split(","));

/**
 * Replays `files` on a throwaway database and reads back `schemas`.
 *
 * @param files - the compiled steps in apply order (`name`, `sql`, `transactional`).
 * @param schemas - the Postgres schemas to read, snake_case module keys; others are ignored.
 * @throws Error when PGlite is not installed, or naming the file of a step that fails.
 * @example
 * const schema = await readMigratedSchema(readMigrationFiles(".stackra/migrations"), ["billing"]);
 * schema.indexes.map((index) => index.name); // ["idx_invoices_number"]
 */
export async function readMigratedSchema(
  files: readonly Pick<MigrationFile, "name" | "sql" | "transactional">[],
  schemas: readonly string[],
): Promise<MigratedSchema> {
  const { PGlite } = loadPeer<{ PGlite: new (options: object) => Pglite }>(
    "@electric-sql/pglite",
    true,
  ) as { PGlite: new (options: object) => Pglite };
  const extensions: Record<string, unknown> = {};
  for (const name of CONTRIB) {
    const loaded = loadPeer<Record<string, unknown>>(`@electric-sql/pglite/contrib/${name}`, true);
    extensions[name] = loaded?.[name];
  }
  const vector = loadPeer<{ vector: unknown }>("@electric-sql/pglite-pgvector", false);
  if (vector !== undefined) extensions["vector"] = vector.vector;
  // PostGIS (ADR 0314) when the member installs its PGlite bundle, so its geography columns replay.
  const postgis = loadPeer<{ postgis: unknown }>("@electric-sql/pglite-postgis", false);
  if (postgis !== undefined) extensions["postgis"] = postgis.postgis;

  const names = schemas.filter((schema) => SCHEMA_NAME.test(schema));
  const inList = names.length === 0 ? "''" : names.map((schema) => `'${schema}'`).join(", ");
  const database = new PGlite({ extensions });
  try {
    // raw-sql: the approved extensions, the compiled migrations and the catalog reads are DDL and introspection of a
    // throwaway database that no model makes; every name interpolated below is checked against SCHEMA_NAME.
    await database.exec(
      Object.keys(extensions)
        .map((name) => `create extension if not exists ${name};`)
        .join("\n"),
    );
    for (const file of files)
      try {
        if (file.transactional && !file.sql.startsWith(NON_TRANSACTIONAL))
          await database.transaction((transaction) => transaction.exec(file.sql));
        else await database.exec(file.sql);
      } catch (error) {
        throw new Error(
          `${file.name} failed: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    const columns = await database.query<MigratedSchema["columns"][number]>(
      `select n.nspname as "schema", c.relname as "table", a.attname::text as "name",
              format_type(a.atttypid, a.atttypmod) as "type", not a.attnotnull as "nullable"
         from pg_attribute a
         join pg_class c on c.oid = a.attrelid
         join pg_namespace n on n.oid = c.relnamespace
        where c.relkind in ('r', 'p') and not c.relispartition and a.attnum > 0 and not a.attisdropped
          and n.nspname in (${inList})
        order by 1, 2, a.attnum`,
    );
    const indexes = await database.query<
      Omit<MigratedSchema["indexes"][number], "columns" | "predicate"> & {
        columns: string;
        predicate: string | null;
      }
    >(
      `select n.nspname as "schema", t.relname as "table", i.relname as "name", x.indisunique as "unique",
              am.amname as "method", pg_get_expr(x.indpred, x.indrelid) as "predicate",
              array_to_string(array(
                select a.attname::text
                  from unnest(x.indkey::int2[]) with ordinality as k(attnum, ord)
                  join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
                 order by k.ord), ',') as "columns"
         from pg_index x
         join pg_class i on i.oid = x.indexrelid
         join pg_class t on t.oid = x.indrelid
         join pg_namespace n on n.oid = t.relnamespace
         join pg_am am on am.oid = i.relam
        where not x.indisprimary and not t.relispartition and n.nspname in (${inList})
        order by 1, 2, 3`,
    );
    const foreignKeys = await database.query<
      Omit<MigratedSchema["foreignKeys"][number], "columns"> & { columns: string }
    >(
      `select n.nspname as "schema", t.relname as "table", c.conname::text as "name",
              rn.nspname as "referencedSchema", rt.relname as "referencedTable",
              array_to_string(array(
                select a.attname::text
                  from unnest(c.conkey) with ordinality as k(attnum, ord)
                  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
                 order by k.ord), ',') as "columns"
         from pg_constraint c
         join pg_class t on t.oid = c.conrelid
         join pg_namespace n on n.oid = t.relnamespace
         join pg_class rt on rt.oid = c.confrelid
         join pg_namespace rn on rn.oid = rt.relnamespace
        where c.contype = 'f' and n.nspname in (${inList})
        order by 1, 2, 3`,
    );
    return {
      columns: columns.rows,
      indexes: indexes.rows.map((row) => ({
        ...row,
        columns: listOf(row.columns),
        predicate: row.predicate ?? undefined,
      })),
      foreignKeys: foreignKeys.rows.map((row) => ({ ...row, columns: listOf(row.columns) })),
    };
  } finally {
    await database.close();
  }
}
