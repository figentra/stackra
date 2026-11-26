/**
 * Stackra file contract:
 * Purpose: `MemoryDatabaseDriver`, the `memory` driver of the `Database` port: real Postgres compiled to WASM (PGlite)
 *          in this process, so unit tests run SQL, migrations and constraints as production does without Docker. It
 *          becomes `Database.current()` when built, and before its first query it creates the approved extensions
 *          and applies the member's compiled migrations (`.stackra/migrations` under the working directory), or,
 *          when the member has none, creates the schema from the registered entities. With migrations, each instance
 *          starts its own PGlite from a snapshot built once per migrations set (`pgliteSnapshot`, kept per process and
 *          in a temp file) instead of running initdb and the migrations again; a member with no migrations keeps
 *          the slow path, because its schema comes from entities registered after the driver is built. Its statements are counted
 *          for the query guard like production's (`observedLogger`). The events its models record reach the testing
 *          app after commit, and a rollback drops them (`RecordedEventsSubscriber`, STA-1740), on a database
 *          restored from a snapshot too.
 * Boundary: the testing entry only, so a server never loads PGlite (ADR 0269 decision 3). PGlite, its extensions and
 *           the ORM driver are optional peers loaded on the first `orm` read (`loadPglitePeers`), not on import. Built with no arguments, so
 *           the container can build it as a wiring candidate; the ORM is made on first use, so entities registered
 *           after the driver was built are still in it. One database per instance, gone on `close`. Each migration
 *           file runs as the runner would run it (a transactional file in one transaction) without the
 *           `schema_migrations` bookkeeping. PGlite is one connection, so a second transaction would wait forever on
 *           the one around it: a `requiresNew` transaction inside a running one is a savepoint here, which commits with
 *           the caller under PGlite. The independent commit is proven only in `.int` tests on Postgres
 *           (`usePostgres`), as is anything else that needs true parallel sessions.
 *           pgvector comes from PGlite's own extension package (`@electric-sql/pglite-pgvector`, the release paired with
 *           the catalog's PGlite); PostGIS from `@electric-sql/pglite-postgis` when the member installs it (a member
 *           with geography columns does, ADR 0314).
 * Runtime: node
 * Governing contract: ADR 0266 (one option, one driver, memory first); ADR 0014; ADR 0097; ADR 0159; ADR 0160
 *                     (decision 2: the approved extensions); ADR 0269 (decision 3); gap db19
 *                     (stackra-284).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { PGlite } from "@electric-sql/pglite";
import { AsyncLocalStorage } from "node:async_hooks";

import { RequestContext, TransactionContext } from "@mikro-orm/core";
import type { MikroORM, PgliteConnection } from "@mikro-orm/pglite";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Driver } from "@stackra/container";
import type { DetachedStep } from "@stackra/actions/contracts";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { connectDetachedRuns } from "#core/functions/connect-detached-runs.function";
import { deleteFilters } from "#core/functions/delete-filters.function";
import { runInScope } from "#core/functions/run-in-scope.function";
import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
import { StampSubscriber } from "#core/orm/stamp.subscriber";
import { Database } from "#core/ports/database.port";
import { runTransaction } from "#core/functions/run-transaction.function";
import { observedLogger } from "#node/functions/observed-logger.function";
import type { TransactionOptions } from "#core/types/transaction-options.type";
import { readMigrationFiles } from "#node/functions/read-migration-files.function";
import { bootstrapPglite } from "#testing/functions/bootstrap-pglite.function";
import { dropSnapshot } from "#testing/functions/drop-snapshot.function";
import { extensionsSql } from "#testing/functions/extensions-sql.function";
import { loadPglitePeers } from "#testing/functions/load-pglite-peers.function";
import { pgliteSnapshot } from "#testing/functions/pglite-snapshot.function";
import { RecordedEventsSubscriber } from "#testing/orm/recorded-events.subscriber";

/** Where gen writes a member's compiled migrations, relative to the member root. */
const MIGRATIONS_FOLDER = join(".stackra", "migrations");

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

  /** The PGlite this instance started from the migrations snapshot (it owns it and closes it). */
  private pglite: Promise<PGlite> | undefined;

  /** The schema setup, run once before the first query. */
  private prepared: Promise<void> | undefined;

  /** The step of each detached call running in this database (`runDetached`). */
  private readonly detachedSteps = new AsyncLocalStorage<DetachedStep>();

  /** Makes the driver `Database.current()` and registers the detached-run wrapper; nothing starts until the first query. */
  constructor() {
    super();
    ACTIVE_DATABASE.current = this;
    connectDetachedRuns();
  }

  /** The MikroORM instance on PGlite. */
  get orm(): MikroORM {
    const { orm } = loadPglitePeers();
    this.instance ??= new orm.MikroORM({
      // PGlite reads an in-memory data directory from the database name.
      dbName: "memory://",
      entities: [...REGISTERED_ENTITIES],
      filters: deleteFilters(REGISTERED_ENTITIES),
      // What a model records reaches the testing app after commit, as the outbox writer hands it on in production;
      // user stamps come from the running call, as a service's boot connects them (STA-2044).
      subscribers: [new StampSubscriber(), new RecordedEventsSubscriber()],
      // Counted like production, so `strictLoading` and `DatabaseQueryBudgetDriver` see a test's statements.
      loggerFactory: (settings) => observedLogger(settings, []),
      namingStrategy: StackraNamingStrategy,
      discovery: { inferDefaultValues: false, warnWhenNoEntities: false },
      allowGlobalContext: false,
      ensureDatabase: false,
      // A member with migrations starts each instance from the shared snapshot; one without creates its schema.
      // reason: PGlite's Extensions and the ORM driver's option type come from separately versioned packages
      // Always this package's PGlite: the ORM driver pins its own older PGlite, which cannot load the extension
      // bundles paired with the catalog's (pgvector, PostGIS).
      driverOptions: {
        pglite: () =>
          existsSync(join(process.cwd(), MIGRATIONS_FOLDER))
            ? this.startFromSnapshot()
            : this.startEmpty(),
      } as never,
      // Kysely opens PGlite's one connection on the first query and awaits this before running it.
      onCreateConnection: () => this.prepare(),
    });
    return this.instance;
  }

  /** The container's shutdown hook: `app.close()` closes the database it built. */
  onApplicationShutdown(): Promise<void> {
    return this.close();
  }

  /** Implements `Database.detached`, documented there: this instance's own store, never another database's. */
  override detached(): DetachedStep | undefined {
    return this.detachedSteps.getStore();
  }

  /**
   * Implements `Database.runDetached`, documented there: `work` runs on a fresh fork as the transaction context, so
   * neither it nor a step it opens joins the call's committed transaction, which MikroORM keeps in the context.
   */
  override runDetached<T>(step: DetachedStep, work: () => Promise<T>): Promise<T> {
    return this.detachedSteps.run(step, () => TransactionContext.create(this.orm.em.fork(), work));
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
   * Implements `Database.transaction`, documented there, through `runTransaction`. Inside a running transaction,
   * `requiresNew` is a savepoint that commits with the caller (PGlite has one connection); its timeouts still apply,
   * and `isolation`, `readOnly` and `retry`, which a savepoint cannot take, are left to the transaction around it.
   *
   * @throws TypeError when `isolation`, `readOnly` or `retry` is asked inside a running transaction without
   *         `requiresNew`.
   */
  transaction<T>(work: () => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const em = this.em();
    if (options.requiresNew === true && em.isInTransaction())
      return runTransaction(em, work, {
        ...(options.timeout === undefined ? {} : { timeout: options.timeout }),
        ...(options.lockTimeout === undefined ? {} : { lockTimeout: options.lockTimeout }),
      });
    return runTransaction(em, work, options);
  }

  /**
   * Implements `Database.withScope`, documented there, through `runInScope`.
   *
   * @throws TypeError for a scope path that is not an `ltree` path.
   */
  withScope<T>(scopes: ScopeRef | readonly ScopeRef[], work: () => Promise<T>): Promise<T> {
    return runInScope(this, scopes, work);
  }

  /** See `Database.close`; the in-memory database is gone afterwards. */
  async close(): Promise<void> {
    if (ACTIVE_DATABASE.current === this) ACTIVE_DATABASE.current = undefined;
    const orm = this.instance;
    this.instance = undefined;
    this.prepared = undefined;
    const pglite = this.pglite;
    this.pglite = undefined;
    await orm?.close(true);
    await (await pglite)?.close();
  }

  /**
   * A fresh PGlite of this instance's own, started from the migrations snapshot (one initdb and migration run per
   * migrations set and machine). A snapshot that will not load is dropped and the instance boots the slow way.
   */
  private startFromSnapshot(): Promise<PGlite> {
    this.pglite ??= (async () => {
      const files = readMigrationFiles(join(process.cwd(), MIGRATIONS_FOLDER));
      const { PGlite, extensions } = loadPglitePeers();
      try {
        const loadDataDir = await pgliteSnapshot(files);
        return await PGlite.create({ extensions, loadDataDir });
      } catch {
        await dropSnapshot(files);
        const pglite = await PGlite.create({ extensions });
        await bootstrapPglite(pglite, files);
        return pglite;
      }
    })();
    return this.pglite;
  }

  /** A fresh, empty PGlite of this instance's own with the approved extensions (a member with no migrations). */
  private startEmpty(): Promise<PGlite> {
    const { PGlite, extensions } = loadPglitePeers();
    this.pglite ??= PGlite.create({ extensions });
    return this.pglite;
  }

  /** Creates the extensions and the entity schema once (a member with no migrations), on PGlite itself. */
  private prepare(): Promise<void> {
    this.prepared ??= (async () => {
      if (existsSync(join(process.cwd(), MIGRATIONS_FOLDER))) return;
      const connection = this.orm.em.getConnection() as unknown as PgliteConnection;
      const pglite = await connection.getNativeClient();
      // raw-sql: extensions are DDL the schema owns, not a query a model makes
      await pglite.exec(extensionsSql(Object.keys(loadPglitePeers().extensions)));
      await pglite.exec(await this.orm.schema.getCreateSchemaSQL());
    })();
    return this.prepared;
  }
}
