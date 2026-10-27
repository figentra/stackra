/**
 * Stackra file contract:
 * Purpose: `MemoryDatabaseDriver`, the `memory` driver of the `Database` port: real Postgres compiled to WASM (PGlite)
 *          in this process, so unit tests run SQL, migrations and constraints as production does without Docker. It
 *          becomes `Database.current()` when built, and before its first query it creates the approved extensions
 *          and applies the member's compiled migrations (`.stackra/migrations` under the working directory), or,
 *          when the member has none, creates the schema from the registered entities.
 * Boundary: the testing entry only, so a server never loads PGlite (ADR 0269 decision 3). Built with no arguments, so
 *           the container can build it as a wiring candidate; the ORM is made on first use, so entities registered
 *           after the driver was built are still in it. One database per instance, gone on `close`. Each migration
 *           file runs as the runner would run it (a transactional file in one transaction) without the
 *           `schema_migrations` bookkeeping. shortcut: PGlite is one connection, so a `requiresNew` transaction runs
 *           on the same session as the one around it; a test that needs true parallel sessions uses `usePostgres`.
 *           shortcut: no pgvector (PGlite 0.5 ships it apart); a member with vector columns tests them in the
 *           integration tier.
 * Runtime: node
 * Governing contract: ADR 0266 (one option, one driver, memory first); ADR 0014; ADR 0097; ADR 0159; ADR 0160
 *                     (decision 2: the approved extensions); ADR 0269 (decision 3).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { citext } from "@electric-sql/pglite/contrib/citext";
import { ltree } from "@electric-sql/pglite/contrib/ltree";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { RequestContext, TransactionContext, TransactionPropagation } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/pglite";
import type { PgliteConnection } from "@mikro-orm/pglite";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { scopeSettings } from "#core/functions/scope-settings.function";
import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
import { Database } from "#core/ports/database.port";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";

/** Where gen writes a member's compiled migrations, relative to the member root. */
const MIGRATIONS_FOLDER = join(".stackra", "migrations");

/** The ADR 0160 extensions PGlite ships (all but `vector`). */
const EXTENSIONS = ["ltree", "pg_trgm", "citext", "pgcrypto"] as const;

/**
 * The in-process Postgres database of the unit tier.
 *
 * @example
 * const database = new MemoryDatabaseDriver(); // now Database.current()
 * await ProductFactory.new().create();
 * await database.close();
 */
export class MemoryDatabaseDriver extends Driver(Database) {
  /** The ORM, made on first use. */
  private instance: MikroORM | undefined;

  /** The schema setup, run once before the first query. */
  private prepared: Promise<void> | undefined;

  /** Makes the driver `Database.current()`; nothing starts until the first query. */
  constructor() {
    super();
    ACTIVE_DATABASE.current = this;
  }

  /** The MikroORM instance on PGlite. */
  get orm(): MikroORM {
    this.instance ??= new MikroORM({
      // PGlite reads an in-memory data directory from the database name.
      dbName: "memory://",
      entities: [...REGISTERED_ENTITIES],
      namingStrategy: StackraNamingStrategy,
      discovery: { inferDefaultValues: false, warnWhenNoEntities: false },
      allowGlobalContext: false,
      ensureDatabase: false,
      driverOptions: { extensions: { ltree, pg_trgm, citext, pgcrypto } },
      // Kysely opens PGlite's one connection on the first query and awaits this before running it.
      onCreateConnection: () => this.prepare(),
    });
    return this.instance;
  }

  /** The container's shutdown hook: `app.close()` closes the database it built. */
  onApplicationShutdown(): Promise<void> {
    return this.close();
  }

  /** Implements `Database.em`, documented there. */
  em(): EntityManager {
    const root = this.orm.em;
    const context =
      TransactionContext.getEntityManager(root.name) ?? RequestContext.getEntityManager(root.name);
    // shortcut: PGlite's entity manager shares the Postgres one's base class but not its declared type.
    return ((context as unknown) ?? root.fork()) as EntityManager;
  }

  /** Implements `Database.transaction`, documented there. */
  transaction<T>(work: () => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    return this.em().transactional(
      () => work(),
      options.requiresNew === true ? { propagation: TransactionPropagation.REQUIRES_NEW } : {},
    );
  }

  /**
   * See `Database.withScope`.
   *
   * @throws TypeError for a scope path that is not an `ltree` path.
   */
  withScope<T>(scopes: ScopeRef | readonly ScopeRef[], work: () => Promise<T>): Promise<T> {
    const settings = scopeSettings(scopes);
    return this.transaction(async () => {
      // raw-sql: set_config is how a transaction carries the scope the row-level-security policies compare with
      await this.em().execute(
        `select ${settings.map(() => "set_config(?, ?, true)").join(", ")}`,
        settings.flat(),
      );
      return work();
    });
  }

  /** See `Database.close`; the in-memory database is gone afterwards. */
  async close(): Promise<void> {
    if (ACTIVE_DATABASE.current === this) ACTIVE_DATABASE.current = undefined;
    const orm = this.instance;
    this.instance = undefined;
    this.prepared = undefined;
    await orm?.close(true);
  }

  /** Creates the extensions and the schema once, on PGlite itself, so it never waits on the connection it serves. */
  private prepare(): Promise<void> {
    this.prepared ??= (async () => {
      const connection = this.orm.em.getConnection() as unknown as PgliteConnection;
      const pglite = await connection.getNativeClient();
      // raw-sql: extensions and compiled migrations are DDL the schema owns, not queries a model makes
      await pglite.exec(
        EXTENSIONS.map((name) => `create extension if not exists ${name};`).join("\n"),
      );
      const folder = join(process.cwd(), MIGRATIONS_FOLDER);
      if (!existsSync(folder)) {
        await pglite.exec(await this.orm.schema.getCreateSchemaSQL());
        return;
      }
      for (const file of readMigrationFiles(folder))
        try {
          if (file.transactional) await pglite.transaction((tx) => tx.exec(file.sql));
          else await pglite.exec(file.sql);
        } catch (error) {
          throw new Error(
            `${file.name} failed: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
    })();
    return this.prepared;
  }
}
