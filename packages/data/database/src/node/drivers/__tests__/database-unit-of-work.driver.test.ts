/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseUnitOfWorkDriver`: it is the actions `UnitOfWork`, and its transaction is the
 *          connected database's, with the action's timeout, and a database error leaves as its refusal.
 * Boundary: test only; the database is a stand-in that records its transactions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 2); ADR 0142; ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { UnitOfWork } from "@stackra/actions/contracts";
import { Duration } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { DuplicateRecordError } from "#core/errors/duplicate-record.error";
import { DatabaseUnitOfWorkDriver } from "#node/drivers/database-unit-of-work.driver";
import { Database } from "#core/ports/database.port";

class RecordingDatabase extends Database {
  readonly options: unknown[] = [];

  transactions = 0;

  em(): EntityManager {
    throw new Error("not used");
  }

  async transaction<T>(work: () => Promise<T>, options?: unknown): Promise<T> {
    this.transactions += 1;
    this.options.push(options);
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
    expect(database.options).toEqual([{}]);
  });

  it("raises a database error that leaves the transaction as its refusal", async () => {
    ACTIVE_DATABASE.current = new RecordingDatabase();
    const unique = Object.assign(new Error("duplicate key"), { code: "23505", constraint: "uq_a" });
    await expect(
      new DatabaseUnitOfWorkDriver().transaction(async () => {
        throw unique;
      }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, DuplicateRecordError));
  });

  it("passes the action's timeout to the transaction", async () => {
    const database = new RecordingDatabase();
    ACTIVE_DATABASE.current = database;
    await new DatabaseUnitOfWorkDriver().transaction(async () => 1, {
      timeout: Duration.seconds(5),
    });
    expect(database.options).toEqual([{ timeout: Duration.seconds(5) }]);
  });
});
