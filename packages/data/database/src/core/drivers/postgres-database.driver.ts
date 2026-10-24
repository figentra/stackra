/**
 * Stackra file contract:
 * Purpose: `PostgresDatabaseDriver`, the `Database` on Postgres through MikroORM: connects with the generated entities
 *          and the Stackra naming strategy, resolves the entity manager of the running context, runs transactions,
 *          and sets the scope settings row-level security reads.
 * Boundary: the only file that starts MikroORM. Gen writes every default and enum item into the entities, so default
 *           inference is off; the global entity manager is never used for work (each call gets the context's or a
 *           fork). `connect` makes it `Database.current()` until `close`.
 * Runtime: node
 * Governing contract: ADR 0014; ADR 0097; ADR 0238; ADR 0239; ADR 0136 (decision 2); the STA-335 entity-schema spike.
 */
import { RequestContext, TransactionContext, TransactionPropagation } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/postgresql";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { scopeSetting } from "#core/functions/scope-setting.function";
import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";
import { Database } from "#core/ports/database.port";
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

  /** @param orm - a connected MikroORM instance; use `connect` instead. */
  constructor(orm: MikroORM) {
    super();
    this.orm = orm;
  }

  /**
   * Connects and makes the driver `Database.current()`.
   *
   * @throws Error when Postgres refuses the connection or an entity schema is invalid.
   */
  static async connect(options: DatabaseOptions): Promise<PostgresDatabaseDriver> {
    const orm = await MikroORM.init({
      clientUrl: options.url,
      entities: [...(options.entities ?? REGISTERED_ENTITIES)],
      subscribers: [...(options.subscribers ?? [])],
      namingStrategy: StackraNamingStrategy,
      discovery: { inferDefaultValues: false },
      allowGlobalContext: false,
      debug: options.debug ?? false,
    });
    const driver = new PostgresDatabaseDriver(orm);
    ACTIVE_DATABASE.current = driver;
    return driver;
  }

  /** See `Database.em`. */
  em(): EntityManager {
    const root = this.orm.em;
    const context =
      TransactionContext.getEntityManager(root.name) ?? RequestContext.getEntityManager(root.name);
    return (context as EntityManager | undefined) ?? root.fork();
  }

  /** See `Database.transaction`. */
  transaction<T>(work: () => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    return this.em().transactional(
      () => work(),
      options.requiresNew === true ? { propagation: TransactionPropagation.REQUIRES_NEW } : {},
    );
  }

  /**
   * See `Database.withScope`.
   *
   * @throws TypeError for a scope level that is not snake_case.
   */
  withScope<T>(scopes: ScopeRef | readonly ScopeRef[], work: () => Promise<T>): Promise<T> {
    const list: readonly ScopeRef[] = "level" in scopes ? [scopes] : scopes;
    const settings = list.map((scope) => [scopeSetting(scope.level), scope.id] as const);
    return this.transaction(async () => {
      const em = this.em();
      // raw-sql: set_config is how a transaction carries the scope the row-level-security policies compare with
      for (const [setting, id] of settings)
        await em.execute("select set_config(?, ?, true)", [setting, id]);
      return work();
    });
  }

  /** See `Database.close`. */
  async close(): Promise<void> {
    if (ACTIVE_DATABASE.current === this) ACTIVE_DATABASE.current = undefined;
    await this.orm.close(true);
  }
}
