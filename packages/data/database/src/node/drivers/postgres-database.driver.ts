/**
 * Stackra file contract:
 * Purpose: `PostgresDatabaseDriver`, the `Database` on Postgres through MikroORM: connects with the generated entities
 *          and the Stackra naming strategy, resolves the entity manager of the running context, runs transactions
 *          (`runTransaction`: statement and lock timeouts, isolation, read-only, retry), starts every session with the configured timeouts, sizes the pool, registers the
 *          `deleted`/`archived` filters of the keep-the-row delete policies, sets the scope
 *          settings row-level security reads, and runs read-only work on a read replica when the
 *          runtime handed it one, unless that replica is not fresh enough for the read (the lag guard: its replay point,
 *          read with `REPLICA_POSITION_SQL` against the primary's position read just before with
 *          `PRIMARY_POSITION_SQL`, and reused for `replicaProbe`, against the read's `maxLag` and `after`);
 *          every statement is counted for the query guard and handed to the
 *          `DatabaseOptions.observers` (`observedLogger`). The ORM's result cache is `EntityResultCacheAdapter`, the
 *          store of `Cached` models.
 * Boundary: the only file that starts MikroORM. Gen writes every default and enum item into the entities, so default
 *           inference is off; the global entity manager is never used for work (each call gets the context's or a
 *           fork). `connect` makes it `Database.current()` until `close` and registers the detached-run wrapper; a detached
 *           call's work runs on a fresh fork as the transaction context, outside the call's committed transaction, with
 *           this instance's own step store (`runDetached`, `detached`). Reads stay on the primary
 *           unless `onReplica` asks (MikroORM's replica preference is off), because the scope settings live in the
 *           primary's transaction. The lag guard measures the one replica connection the read then uses, so a read
 *           never measures one replica and reads another; a replica that is not fresh sends the read to the primary,
 *           never to an error. A replica counts as caught up only once it has replayed through the primary's position,
 *           never through the WAL it received itself, so a standby whose WAL receiver stopped is judged by its growing
 *           lag (STA-1464 review); a primary that does not answer that reading leaves the lag alone to decide.
 * Runtime: node
 * Governing contract: ADR 0014; ADR 0097; ADR 0238; ADR 0239; ADR 0327 (decisions 3 and 5); ADR 0136 (decision 2); the
 *                     STA-335 entity-schema spike; ADR 0057 (decision 6: read replica); ADR 0473 (decision 2: the pool);
 *                     data-layer gap mo6 (stackra-279: transaction options); gaps sc7 and sc8 (stackra-282: query
 *                     telemetry and the N+1 guard); gap sc11 (stackra-307, STA-1464: the lag guard).
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { RequestContext, TransactionContext } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/postgresql";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Driver } from "@stackra/container";
import type { DetachedStep } from "@stackra/actions/contracts";
import { Duration } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { PRIMARY_POSITION_SQL } from "#core/constants/primary-position-sql.constant";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { REPLICA_POSITION_SQL } from "#core/constants/replica-position-sql.constant";
import { connectDetachedRuns } from "#core/functions/connect-detached-runs.function";
import { deleteFilters } from "#core/functions/delete-filters.function";
import { poolConfig } from "#core/functions/pool-config.function";
import { readRowSecuritySettings } from "#core/functions/read-row-security-settings.function";
import { replayRowSecuritySettings } from "#core/functions/replay-row-security-settings.function";
import { replicaIsFresh } from "#core/functions/replica-is-fresh.function";
import { replicaPositionOf } from "#core/functions/replica-position-of.function";
import { runInScope } from "#core/functions/run-in-scope.function";
import { sessionTimeoutsUrl } from "#core/functions/session-timeouts-url.function";
import { runTransaction } from "#core/functions/run-transaction.function";
import { EntityResultCacheAdapter } from "#core/orm/entity-result-cache.adapter";
import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
import { Database } from "#core/ports/database.port";
import { observedLogger } from "#node/functions/observed-logger.function";
import type { DatabaseOptions } from "#core/types/database-options.type";
import type { ReplicaFreshness } from "#core/types/replica-freshness.type";
import type { ReplicaPosition } from "#core/types/replica-position.type";
import type { TransactionOptions } from "#core/types/transaction-options.type";

/** A replica connection of the ORM. */
type ReplicaConnection = ReturnType<EntityManager["getConnection"]>;

/** How long a lag reading is reused when `connect` is given no `replicaProbe`. */
const REPLICA_PROBE = Duration.seconds(1);

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

  /** The step of each detached call running in this database (`runDetached`). */
  private readonly detachedSteps = new AsyncLocalStorage<DetachedStep>();

  /** How long a replica's lag reading is reused, in milliseconds; `connect` sets it from `replicaProbe`. */
  private replicaProbe = Duration.toMilliseconds(REPLICA_PROBE);

  /** The latest lag reading of each replica connection. */
  private readonly positions = new WeakMap<ReplicaConnection, ReplicaPosition>();

  /** The lag reading under way on each replica connection, shared by the reads that wait for it. */
  private readonly probes = new WeakMap<ReplicaConnection, Promise<ReplicaPosition>>();

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
      // a raw-SQL driver (idempotency, rate limits, holds) connects with no entities registered
      discovery: { inferDefaultValues: false, warnWhenNoEntities: false },
      allowGlobalContext: false,
      debug: options.debug ?? false,
      loggerFactory: (settings) => observedLogger(settings, options.observers ?? []),
    });
    const driver = new PostgresDatabaseDriver(orm);
    if (options.replicaProbe !== undefined)
      driver.replicaProbe = Duration.toMilliseconds(options.replicaProbe);
    ACTIVE_DATABASE.current = driver;
    connectDetachedRuns();
    return driver;
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
   * Implements `Database.withScope`, documented there, through `runInScope`.
   *
   * @throws TypeError for a scope path that is not an `ltree` path.
   */
  withScope<T>(scopes: ScopeRef | readonly ScopeRef[], work: () => Promise<T>): Promise<T> {
    return runInScope(this, scopes, work);
  }

  /**
   * See `Database.onReplica`. With no replica connected, or with `freshness` and a replica that is not fresh enough
   * for it, it runs `work` in the running context (on the primary).
   *
   * @throws Error when the replica refuses the connection, or `work` writes.
   */
  override async onReplica<T>(
    work: () => Promise<T>,
    freshness: ReplicaFreshness = {},
  ): Promise<T> {
    if ((this.orm.config.get("replicas") ?? []).length === 0) return work();
    const connection = this.orm.em.getConnection("read");
    if (
      (freshness.maxLag !== undefined || freshness.after !== undefined) &&
      !(await this.fresh(connection, freshness))
    )
      return work();
    const settings = await readRowSecuritySettings(this.em());
    return connection.transactional(
      async (trx) => {
        const em = this.orm.em.fork();
        em.setTransactionContext(trx);
        await replayRowSecuritySettings(settings, (sql, params) =>
          connection.execute(sql, params, "all", trx),
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

  /**
   * Whether `connection`'s replica is fresh enough for `freshness`, from its reading when that is recent; a reading
   * that fails only because it aged since it was taken is taken again once.
   */
  private async fresh(
    connection: ReplicaConnection,
    freshness: ReplicaFreshness,
  ): Promise<boolean> {
    const now = Date.now();
    const known = this.positions.get(connection);
    const position =
      known !== undefined && now - known.measuredAt < this.replicaProbe
        ? known
        : await this.probe(connection);
    if (replicaIsFresh(position, Date.now(), freshness)) return true;
    if (!replicaIsFresh(position, position.measuredAt, freshness)) return false;
    return replicaIsFresh(await this.probe(connection), Date.now(), freshness);
  }

  /**
   * Reads `connection`'s replay point (one reading at a time per connection) and keeps it: first the primary's
   * position, then whether the replica has replayed through it and its lag.
   */
  private probe(connection: ReplicaConnection): Promise<ReplicaPosition> {
    const running = this.probes.get(connection);
    if (running !== undefined) return running;
    const measuredAt = Date.now();
    const reading = this.primaryPosition()
      .then((lsn) =>
        connection.execute<Record<string, unknown>>(REPLICA_POSITION_SQL, [lsn], "get"),
      )
      .then((row) => {
        const position = replicaPositionOf(row, measuredAt);
        this.positions.set(connection, position);
        return position;
      })
      .finally(() => this.probes.delete(connection));
    this.probes.set(connection, reading);
    return reading;
  }

  /**
   * The primary's WAL insert position as text, or null when the primary does not answer (no replica then counts as
   * caught up, and its lag alone decides).
   */
  private async primaryPosition(): Promise<string | null> {
    const row = await this.orm.em
      .getConnection("write")
      .execute<Record<string, unknown>>(PRIMARY_POSITION_SQL, [], "get")
      .catch(() => undefined);
    const lsn = row?.["lsn"];
    return typeof lsn === "string" ? lsn : null;
  }
}
