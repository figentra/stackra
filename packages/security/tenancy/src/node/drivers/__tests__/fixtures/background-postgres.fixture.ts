/**
 * Stackra file contract:
 * Purpose: the integration fixture of the background units' isolation on real Postgres (STA-1717): a tenant-owned
 *          ticket table made by `t.belongsToTenant()`, the scope tree's table with its generated ancestor policy, a
 *          scope tree read with SQL on a given connection (so that connection's role and row security decide what it
 *          shows, as `PostgresScopeTreeDriver` does), another package's migrations loaded by their path, a login
 *          connection as a NOBYPASSRLS non-owner role, and the check that a connection carries no `app.*` setting
 *          or role once a unit has ended.
 * Boundary: test only; used by `background-isolation.int.test.ts`. A package's migrations are found the way gen finds
 *           them (`node_modules/<package>/src/node/database/migrations/*.migration.ts`, ADR 0159 decision 2), since no
 *           package re-exports its migrations; each imports only @stackra/database. The scope tree's table is the
 *           scope package's migration minus the timestamps, for the same reason.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (integration tier); ADR 0159 (decision 2); ADR 0495; `.agents/rules/tenancy.md`
 *                     (point 8).
 */
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { compileMigration, Extension, Migration } from "@stackra/database";
import type { Blueprint, CompiledMigration, Database, SchemaBuilder } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";
import { ScopeTree } from "@stackra/scope/contracts";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { expect } from "@stackra/testing";

/** The tenant-owned table the background units read, made by the macro under test. */
export class CreateTicketsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("tickets", (t: Blueprint) => {
      t.hasPublicId("tkt");
      t.belongsToTenant();
      t.string("title", 63).notNull().comment("What the ticket is about.");
    });
  }
}

/** The scope tree's table, with the generated policy of the scope package's own migration (minus the timestamps). */
export class CreateScopeTreeMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("scope_nodes", (t: Blueprint) => {
      t.hasPublicId("scp");
      t.string("level", 63).notNull().comment("The key of the level the node sits at.");
      t.scopePath().notNull().comment("The node's materialised path, root first.");
      t.string("name", 200).notNull().comment("The node's display name.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}

/** This package's root, where its `node_modules` links the packages it depends on. */
const ROOT = new URL("../../../../../", import.meta.url);

/**
 * The migrations of workspace package `name`, in apply order, compiled into `schema` (the first creates it), found by
 * their path as gen finds them.
 *
 * @example
 * const outbox = await packageMigrations("@stackra/outbox", "outbox");
 */
export async function packageMigrations(
  name: string,
  schema: string,
): Promise<readonly CompiledMigration[]> {
  const folder = new URL(`node_modules/${name}/src/node/database/migrations/`, ROOT);
  const files = readdirSync(fileURLToPath(folder))
    .filter((file) => file.endsWith(".migration.ts"))
    .sort();
  const compiled: CompiledMigration[] = [];
  for (const [index, file] of files.entries()) {
    const exported = (await import(
      pathToFileURL(fileURLToPath(new URL(file, folder))).href
    )) as Record<string, unknown>;
    const migration = Object.values(exported).find(
      (value): value is typeof Migration =>
        typeof value === "function" && value.prototype instanceof Migration,
    );
    if (migration === undefined) throw new TypeError(`${name}: ${file} exports no migration`);
    compiled.push(compileMigration(migration, { schema, createsSchema: index === 0 }));
  }
  return compiled;
}

/** Applies `migration` step by step on `database`, as `usePostgres` applies its own. */
export async function applyMigration(
  database: PostgresDatabaseDriver,
  migration: CompiledMigration,
): Promise<void> {
  for (const step of migration.steps)
    await database.orm.schema.execute(step.sql.join(";\n"), { wrap: step.transactional });
}

/**
 * A connection to the database at `url` as the login role `role`, with a pool of `max` connections.
 *
 * @example
 * const service = await connectAs(postgres.url, "stackra_app", password, 2);
 */
export function connectAs(
  url: string,
  role: string,
  password: string,
  max: number,
): Promise<PostgresDatabaseDriver> {
  const as = new URL(url);
  as.username = role;
  as.password = password;
  return PostgresDatabaseDriver.connect({ url: as.toString(), entities: [], pool: { max } });
}

/** The entry of one `scope.scope_nodes` row. */
const entryOf = (row: Record<string, unknown>): ScopeEntry => ({
  id: String(row["id"]) as PublicId<"scp">,
  path: String(row["scope_path"]),
  level: String(row["level"]),
  name: String(row["name"]),
});

/** The columns of a node, its path as text. */
const NODE = 'select id, scope_path::text as scope_path, level, name from "scope"."scope_nodes"';

/**
 * The scope tree read with SQL on `database`, in the caller's transaction and scope session: its row security shows
 * the session's granted subtrees and, outside every scope session, no node, as `PostgresScopeTreeDriver` does.
 */
export class SqlScopeTree extends Driver(ScopeTree) {
  /** The connection the tree is read on. */
  private readonly database: Database;

  /**
   * @param database - the connection the tree is read on.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `ScopeTree.node`, documented there. */
  async node(id: PublicId<"scp">): Promise<ScopeEntry | undefined> {
    const [row] = await this.rows(`${NODE} where id = ?`, [id]);
    return row === undefined ? undefined : entryOf(row);
  }

  /** Implements `ScopeTree.byPath`, documented there. */
  async byPath(path: string): Promise<ScopeEntry | undefined> {
    const [row] = await this.rows(`${NODE} where scope_path = ?::ltree`, [path]);
    return row === undefined ? undefined : entryOf(row);
  }

  /** Implements `ScopeTree.ancestors`, documented there. */
  async ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (
      await this.rows(
        `${NODE} where scope_path @> ?::ltree and scope_path <> ?::ltree order by scope_path`,
        [scope.path, scope.path],
      )
    ).map(entryOf);
  }

  /** Implements `ScopeTree.descendants`, documented there. */
  async descendants(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (
      await this.rows(
        `${NODE} where scope_path <@ ?::ltree and scope_path <> ?::ltree order by scope_path`,
        [scope.path, scope.path],
      )
    ).map(entryOf);
  }

  /** The rows `sql` reads on the tree's connection. */
  private async rows(
    sql: string,
    params: readonly unknown[],
  ): Promise<readonly Record<string, unknown>[]> {
    // raw-sql: the fixture's tree has no model; one bound read under the table's row security
    return (await this.database.em().execute(sql, [...params])) as Record<string, unknown>[];
  }
}

/** The backend of the statement `database` runs now: the running transaction's connection, or any free one. */
export async function backendOf(database: Database): Promise<number> {
  // raw-sql: the connection's backend id, which only SQL reads
  const [row] = (await database.em().execute("select pg_backend_pid() as pid")) as {
    pid: number;
  }[];
  if (row === undefined) throw new Error("no backend answered");
  return row.pid;
}

/** Reads a connection's backend, role and row-security settings, holding it a moment so others are handed out. */
const PROBE =
  "select pg_backend_pid() as pid, current_user as role, " +
  "coalesce(current_setting('app.tenant_id', true), '') as tenant, " +
  "coalesce(current_setting('app.scope_id', true), '') as scope_id, " +
  "coalesce(current_setting('app.scope_path', true), '') as scope_path, " +
  "coalesce(current_setting('app.scope_paths', true), '') as scope_paths, pg_sleep(0.05)::text as held";

/**
 * Reads the row-security settings and the role outside any transaction on every connection of a pool of `size` (that
 * many reads at once, each holding its connection) until each backend of `used` has answered, and expects every
 * answer to carry no `app.*` setting and the login role itself (no `set role` left over).
 */
export async function expectCleanBackends(
  database: Database,
  role: string,
  used: ReadonlySet<number>,
  size: number,
): Promise<void> {
  const seen = new Set<number>();
  for (let round = 0; round < 20 && [...used].some((pid) => !seen.has(pid)); round += 1) {
    const rows = await Promise.all(
      Array.from(
        { length: size },
        // raw-sql: the settings are connection state, which only SQL reads
        async () => (await database.em().execute(PROBE)) as Record<string, unknown>[],
      ),
    );
    for (const [row] of rows) {
      expect(row).toMatchObject({
        role,
        tenant: "",
        scope_id: "",
        scope_path: "",
        scope_paths: "",
      });
      seen.add(Number(row?.["pid"]));
    }
  }
  expect([...used].filter((pid) => !seen.has(pid))).toEqual([]);
}
