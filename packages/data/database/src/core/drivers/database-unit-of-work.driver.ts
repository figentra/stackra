/**
 * Stackra file contract:
 * Purpose: `DatabaseUnitOfWorkDriver`, the action pipeline's `UnitOfWork` on the connected database: an action's
 *          `handle` runs in one transaction, so every `CrudService` write it makes commits or rolls back together, and
 *          the models it changed flush once at commit.
 * Boundary: a driver of the @stackra/actions port (driver name `database`); it reads `Database.current()`, so it needs
 *           no wiring of its own. External calls belong in `afterCommit`, which the pipeline runs after this resolves.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 2: one transaction per action); ADR 0098 (the pipeline); ADR 0142 (drivers).
 */
import { UnitOfWork } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";

import { Database } from "#core/ports/database.port";

/**
 * The unit of work on the database.
 *
 * @example
 * // generated wiring: { port: UnitOfWork, candidates: { database: () => import("@stackra/database").then((m) => m.DatabaseUnitOfWorkDriver) } }
 */
export class DatabaseUnitOfWorkDriver extends Driver(UnitOfWork) {
  /** Runs `work` in a transaction of the connected database. */
  transaction<T>(work: () => Promise<T>): Promise<T> {
    return Database.current().transaction(work);
  }
}
