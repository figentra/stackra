/**
 * Stackra file contract:
 * Purpose: the `Database` port: the connected MikroORM database of a service. It hands out the entity manager of the
 *          running context, runs work in a transaction, runs work inside a scope (the application layer of
 *          row-level isolation), and closes.
 * Boundary: the ORM itself is MikroORM, which only this package imports (ADR 0097). `Database.current()` is the
 *           connected driver for code that cannot inject it; everything else injects `Database`. A scope is a
 *           contracts `ScopeRef`, so this package names no scope level.
 * Runtime: node
 * Governing contract: ADR 0014; ADR 0097 (decision 2); ADR 0238; ADR 0239; `.agents/rules/tenancy.md` (two layers).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import type { TransactionOptions } from "#core/types/transaction-options.type";

/**
 * The service's database.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url });
 * await database.withScope(scope, () => orders.cancel(order, reason));
 */
export abstract class Database extends Port {
  /**
   * The connected database.
   *
   * @throws Error before a driver connected, or after it closed.
   */
  static current(): Database {
    const database = ACTIVE_DATABASE.current;
    if (database === undefined)
      throw new Error(
        "No database is connected: the app's boot (or usePostgres in a test) connects one first",
      );
    return database;
  }

  /** The entity manager of the running transaction or request, else a fresh fork for one call. */
  abstract em(): EntityManager;

  /** Runs `work` in a transaction (a savepoint inside one already running): commits when it resolves. */
  abstract transaction<T>(work: () => Promise<T>, options?: TransactionOptions): Promise<T>;

  /**
   * Runs `work` in a transaction whose setting `app.<level>_id` holds each scope's id, which the row-level-security
   * policy of every scoped table compares with. Inside a running transaction the setting lasts until it ends.
   */
  abstract withScope<T>(scopes: ScopeRef | readonly ScopeRef[], work: () => Promise<T>): Promise<T>;

  /** Closes the connection pool; `Database.current()` throws afterwards. */
  abstract close(): Promise<void>;
}
