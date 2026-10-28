/**
 * Stackra file contract:
 * Purpose: `PostgresDatabaseDriver`, the `Database` on Postgres through MikroORM: connects with the generated entities
 *          and the Stackra naming strategy, resolves the entity manager of the running context, runs transactions
 *          (`runTransaction`: statement and lock timeouts, isolation, read-only, retry), starts every session with the configured timeouts, sizes the pool, registers the
 *          `deleted`/`archived` filters of the keep-the-row delete policies, sets the scope
 *          settings row-level security reads, and runs read-only work on a read replica when the
 *          runtime handed it one; every statement is counted for the query guard and handed to the
 *          `DatabaseOptions.observers` (`observedLogger`). The ORM's result cache is `EntityResultCacheAdapter`, the
 *          store of `Cached` models.
 * Boundary: the only file that starts MikroORM. Gen writes every default and enum item into the entities, so default
 *           inference is off; the global entity manager is never used for work (each call gets the context's or a
 *           fork). `connect` makes it `Database.current()` until `close`. Reads stay on the primary
 *           unless `onReplica` asks (MikroORM's replica preference is off), because the scope settings live in the
 *           primary's transaction.
 * Runtime: node
 * Governing contract: ADR 0014; ADR 0097; ADR 0238; ADR 0239; ADR 0327 (decisions 3 and 5); ADR 0136 (decision 2); the
 *                     STA-335 entity-schema spike; ADR 0057 (decision 6: read replica); ADR 0473 (decision 2: the pool);
 *                     data-layer gap mo6 (stackra-279: transaction options); gaps sc7 and sc8 (stackra-282: query
 *                     telemetry and the N+1 guard).
 */
import { RequestContext, TransactionContext } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/postgresql";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { deleteFilters } from "#core/functions/delete-filters.function";
import { poolConfig } from "#core/functions/pool-config.function";
import { scopeSettings } from "#core/functions/scope-settings.function";
import { sessionTimeoutsUrl } from "#core/functions/session-timeouts-url.function";
import { runTransaction } from "#core/functions/run-transaction.function";
import { EntityResultCacheAdapter } from "#core/orm/entity-result-cache.adapter";
import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
import { Database } from "#core/ports/database.port";
import { observedLogger } from "#node/functions/observed-logger.function";
import type { DatabaseOptions } from "#core/types/database-options.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";

/**
 * The Postgres database.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url: connectionString });
 * await database.transaction(() => orders.markPaid(orderId, paymentId, capturedAt));
 * await database.close();
 */
export class PostgresDatabaseDriver extends Driver(Database) {
  /** The MikroORM instance. */
  readonly orm: MikroORM;

  /**
   * @param orm - a connected MikroORM instance; use `connect` instead.
   */
  constructor(orm: MikroORM) {
    super();
    this.orm = orm;
  }

  /**
   * Connects and makes the driver `Database.current()`.
   *
   * @throws Error when Postgres refuses the connection or an entity schema is invalid.
   * @throws RangeError when `options.pool` cannot serve a query (`poolConfig`).
   */
  static async connect(options: DatabaseOptions): Promise<PostgresDatabaseDriver> {
    const entities = [...(options.entities ?? REGISTERED_ENTITIES)];
    const orm = await MikroORM.init({
      clientUrl: sessionTimeoutsUrl(options.url, options.timeouts),
      ...(options.replicas === undefined || options.replicas.length === 0
        ? {}
        : {
            replicas: options.replicas.map((url) => ({
              clientUrl: sessionTimeoutsUrl(url, options.timeouts),
            })),
          }),
      preferReadReplicas: false,
      ...(options.pool === undefined ? {} : { pool: poolConfig(options.pool) }),
      entities,
      filters: deleteFilters(entities),
      subscribers: [...(options.subscribers ?? [])],
      resultCache: { adapter: EntityResultCacheAdapter },
      namingStrategy: StackraNamingStrategy,
      discovery: { inferDefaultValues: false },
      allowGlobalContext: false,
      debug: options.debug ?? false,
      loggerFactory: (settings) => observedLogger(settings, options.observers ?? []),
    });
    const driver = new PostgresDatabaseDriver(orm);
    ACTIVE_DATABASE.current = driver;
    return driver;
  }

  /** Implements `Database.em`, documented there. */
  em(): EntityManager {
    const root = this.orm.em;
    const context =
      TransactionContext.getEntityManager(root.name) ?? RequestContext.getEntityManager(root.name);
    return (context as EntityManager | undefined) ?? root.fork();
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

  /**
   * See `Database.onReplica`. With no replica connected it runs `work` in the running context.
   *
   * @throws Error when the replica refuses the connection, or `work` writes.
   */
  override async onReplica<T>(work: () => Promise<T>): Promise<T> {
    if ((this.orm.config.get("replicas") ?? []).length === 0) return work();
    const current = this.em();
    // raw-sql: pg_settings lists the custom `app.*` settings (scope, tenant) the running transaction carries
    const settings: readonly { name: string; setting: string }[] = current.isInTransaction()
      ? await current.execute("select name, setting from pg_settings where name like 'app.%'")
      : [];
    const connection = this.orm.em.getConnection("read");
    return connection.transactional(
      async (trx) => {
        const em = this.orm.em.fork();
        em.setTransactionContext(trx);
        if (settings.length > 0)
          // raw-sql: the same set_config withScope writes, replayed in the replica's transaction
          await connection.execute(
            `select ${settings.map(() => "set_config(?, ?, true)").join(", ")}`,
            settings.flatMap(({ name, setting }) => [name, setting]),
            "all",
            trx,
          );
        return TransactionContext.create(em, work);
      },
      { readOnly: true },
    );
  }

  /** Implements `Database.close`, documented there. */
  async close(): Promise<void> {
    if (ACTIVE_DATABASE.current === this) ACTIVE_DATABASE.current = undefined;
    await this.orm.close(true);
  }
}
