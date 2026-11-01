/**
 * Stackra file contract:
 * Purpose: `MemoryDatabaseDriver`, the `memory` driver of the `Database` port: real Postgres compiled to WASM (PGlite)
 *          in this process, so unit tests run SQL, migrations and constraints as production does without Docker. It
 *          becomes `Database.current()` when built, and before its first query it creates the approved extensions
 *          and applies the member's compiled migrations (`.stackra/migrations` under the working directory), or,
 *          when the member has none, creates the schema from the registered entities. Its statements are counted
 *          for the query guard like production's (`observedLogger`). The events its models record reach the testing
 *          app after commit, and a rollback drops them (`RecordedEventsSubscriber`, STA-1740).
 * Boundary: the testing entry only, so a server never loads PGlite (ADR 0269 decision 3). PGlite, its extensions and
 *           the ORM driver are optional peers loaded on the first `orm` read (`requireTestPeer`), not on import. Built with no arguments, so
 *           the container can build it as a wiring candidate; the ORM is made on first use, so entities registered
 *           after the driver was built are still in it. One database per instance, gone on `close`. Each migration
 *           file runs as the runner would run it (a transactional file in one transaction) without the
 *           `schema_migrations` bookkeeping. shortcut: PGlite is one connection, so a `requiresNew` transaction runs
 *           on the same session as the one around it; a test that needs true parallel sessions uses `usePostgres`.
 *           pgvector comes from PGlite's own extension package (`@electric-sql/pglite-pgvector`, the release paired with
 *           the catalog's PGlite). shortcut: no PostGIS here (PGlite's PostGIS package needs PGlite 0.5.9 or later);
 *           a member with geography columns tests them in the integration tier (`usePostgres`) until the catalog
 *           moves.
 * Runtime: node
 * Governing contract: ADR 0266 (one option, one driver, memory first); ADR 0014; ADR 0097; ADR 0159; ADR 0160
 *                     (decision 2: the approved extensions); ADR 0269 (decision 3); gap db19
 *                     (stackra-284).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Extension, Extensions } from "@electric-sql/pglite";
import type { vector } from "@electric-sql/pglite-pgvector";
import { RequestContext, TransactionContext } from "@mikro-orm/core";
import type * as PgliteOrm from "@mikro-orm/pglite";
import type { MikroORM, PgliteConnection } from "@mikro-orm/pglite";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { deleteFilters } from "#core/functions/delete-filters.function";
import { scopeSettings } from "#core/functions/scope-settings.function";
import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
import { Database } from "#core/ports/database.port";
import { runTransaction } from "#core/functions/run-transaction.function";
import { observedLogger } from "#node/functions/observed-logger.function";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import { requireTestPeer } from "#testing/functions/require-test-peer.function";
import { RecordedEventsSubscriber } from "#testing/orm/recorded-events.subscriber";

/** Where gen writes a member's compiled migrations, relative to the member root. */
const MIGRATIONS_FOLDER = join(".stackra", "migrations");

/** The approved extensions PGlite runs: all of ADR 0160's; PostGIS (ADR 0314) is not loaded yet. */
const EXTENSIONS = ["vector", "ltree", "pg_trgm", "citext", "pgcrypto"] as const;

/** What PGlite and the ORM driver need, loaded together on first use and kept. */
let peers: { readonly orm: typeof PgliteOrm; readonly extensions: Extensions } | undefined;

/** Loads PGlite, its contrib extensions, pgvector and the ORM driver; none is loaded before a database is used. */
function loadPeers(): NonNullable<typeof peers> {
  peers ??= {
    orm: requireTestPeer<typeof PgliteOrm>("@mikro-orm/pglite"),
    extensions: {
      vector: requireTestPeer<{ vector: typeof vector }>("@electric-sql/pglite-pgvector").vector,
      ltree: requireTestPeer<{ ltree: Extension }>("@electric-sql/pglite/contrib/ltree").ltree,
      pg_trgm: requireTestPeer<{ pg_trgm: Extension }>("@electric-sql/pglite/contrib/pg_trgm")
        .pg_trgm,
      citext: requireTestPeer<{ citext: Extension }>("@electric-sql/pglite/contrib/citext").citext,
      pgcrypto: requireTestPeer<{ pgcrypto: Extension }>("@electric-sql/pglite/contrib/pgcrypto")
        .pgcrypto,
    },
  };
  return peers;
}

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
    const { orm, extensions } = loadPeers();
    this.instance ??= new orm.MikroORM({
      // PGlite reads an in-memory data directory from the database name.
      dbName: "memory://",
      entities: [...REGISTERED_ENTITIES],
      filters: deleteFilters(REGISTERED_ENTITIES),
      // What a model records reaches the testing app after commit, as the outbox writer hands it on in production.
      subscribers: [new RecordedEventsSubscriber()],
      // Counted like production, so `strictLoading` and `DatabaseQueryBudgetDriver` see a test's statements.
      loggerFactory: (settings) => observedLogger(settings, []),
      namingStrategy: StackraNamingStrategy,
      discovery: { inferDefaultValues: false, warnWhenNoEntities: false },
      allowGlobalContext: false,
      ensureDatabase: false,
      // reason: PGlite's Extensions and the ORM driver's option type come from separately versioned packages
      driverOptions: { extensions: extensions as never },
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

  /**
   * Implements `Database.transaction`, documented there, through `runTransaction`.
   *
   * @throws TypeError when `isolation`, `readOnly` or `retry` is asked inside a running transaction without
   *         `requiresNew`.
   */
  transaction<T>(work: () => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    return runTransaction(this.em(), work, options);
  }

  /**
   * Implements `Database.withScope`, documented there.
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
