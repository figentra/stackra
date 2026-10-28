/**
 * Stackra file contract:
 * Purpose: the `Database` port: the connected MikroORM database of a service. It hands out the entity manager of the
 *          running context, runs work in a transaction, runs work inside a scope (the application layer of
 *          row-level isolation), runs read-only work on a read replica, and closes.
 * Boundary: the ORM itself is MikroORM, which only this package imports (ADR 0097). `Database.current()` is the
 *           connected driver for code that cannot inject it; everything else injects `Database`. A scope is a
 *           contracts `ScopeRef`, a node's id and `ltree` path; levels are deployment data, so none is named here.
 *           Isolation stays in the database: nothing adds a WHERE filter to queries. It stays in `.` and not in
 *           `./contracts` because it carries `Database.current()` over the core `ACTIVE_DATABASE` constant, 33 files in
 *           other packages import it from `.`, and contracts holds only ports, enums and types that never import core.
 * Runtime: node
 * Governing contract: ADR 0014; ADR 0097 (decision 2); ADR 0238; ADR 0239; ADR 0327 (decisions 2, 3, 5, 8 and 9);
 *                     ADR 0057 (decision 6: read replica); `.agents/rules/tenancy.md` (two layers).
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

  /**
   * Runs `work` in a transaction (a savepoint inside one already running): commits when it resolves. A transaction it
   * starts takes `isolation`, `readOnly` and `retry` (the whole work again after a serialization failure or deadlock);
   * `timeout` and `lockTimeout` hold until the outermost transaction ends.
   *
   * @throws TypeError when `isolation`, `readOnly` or `retry` is asked inside a running transaction without
   *         `requiresNew`.
   * @example
   * await database.transaction(() => seats.book(showId, seat), { isolation: Isolation.Serializable, retry: 3 });
   */
  abstract transaction<T>(work: () => Promise<T>, options?: TransactionOptions): Promise<T>;

  /**
   * Runs `work` in a transaction with the scope settings the generated row-level-security policies read: for one
   * scope `app.scope_id` and `app.scope_path`, and for one or several granted scopes `app.scope_paths`, their paths
   * joined by `|`. A setting with nothing to hold is `''`, which matches no row, so no granted scope sees nothing.
   * Inside a running transaction the settings last until it ends.
   *
   * @throws TypeError for a scope path that is not an `ltree` path.
   */
  abstract withScope<T>(scopes: ScopeRef | readonly ScopeRef[], work: () => Promise<T>): Promise<T>;

  /**
   * Runs read-only `work` on a read replica, in its own read-only transaction carrying the running transaction's
   * `app.*` settings (the scope and tenant the row-level-security policies read), so isolation holds there too. The
   * replica lags the primary and never sees the running transaction's uncommitted writes; a write inside `work` fails.
   * A driver with no replica runs `work` as it is, in the running context, which is what this default does.
   *
   * @example
   * const rows = await database.onReplica(() => this.visits.find({ day: { $gte: from } }));
   */
  onReplica<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  /** Closes the connection pool; `Database.current()` throws afterwards. */
  abstract close(): Promise<void>;
}
