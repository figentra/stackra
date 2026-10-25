/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseUnitOfWorkDriver`: it is the actions `UnitOfWork`, and its transaction is the
 *          connected database's.
 * Boundary: test only; the database is a stand-in that records its transactions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 2); ADR 0142; ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { UnitOfWork } from "@stackra/actions/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { DatabaseUnitOfWorkDriver } from "#core/drivers/database-unit-of-work.driver";
import { Database } from "#core/ports/database.port";

class RecordingDatabase extends Database {
  transactions = 0;

  em(): EntityManager {
    throw new Error("not used");
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    this.transactions += 1;
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe(DatabaseUnitOfWorkDriver, () => {
  it("runs the action's work in a transaction of the connected database", async () => {
    const database = new RecordingDatabase();
    ACTIVE_DATABASE.current = database;
    const unit = new DatabaseUnitOfWorkDriver();
    expect(unit).toBeInstanceOf(UnitOfWork);
    expect(await unit.transaction(async () => "done")).toBe("done");
    expect(database.transactions).toBe(1);
  });
});
