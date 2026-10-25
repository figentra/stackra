/**
 * Stackra file contract:
 * Purpose: unit tests of `DATABASE_TESTING_PLUGIN`: `.seed(...)` runs each seeder in its own transaction when the
 *          module compiles, and `app.transaction(work)` runs work in a transaction of the connected database.
 * Boundary: test only; the database is a stand-in that counts transactions, and the module is an empty one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3); ADR 0190; ADR 0022.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Module } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Seeder } from "#core/bases/seeder.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";
import { DATABASE_TESTING_PLUGIN } from "#testing/constants/database-testing-plugin.constant";

class CountingDatabase extends Database {
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

class FixtureModule extends Module {}

const seeded: string[] = [];

class FirstSeeder extends Seeder {
  async run(): Promise<void> {
    seeded.push("first");
    await Promise.resolve();
  }
}

class SecondSeeder extends Seeder {
  async run(): Promise<void> {
    seeded.push("second");
    await Promise.resolve();
  }
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe("DATABASE_TESTING_PLUGIN", () => {
  it("seeds in order, each in a transaction, and adds app.transaction", async () => {
    const database = new CountingDatabase();
    ACTIVE_DATABASE.current = database;
    const app = await createTestingModule(FixtureModule).seed(FirstSeeder, SecondSeeder).compile();
    expect(DATABASE_TESTING_PLUGIN.name).toBe("@stackra/database");
    expect(seeded).toEqual(["first", "second"]);
    expect(database.transactions).toBe(2);
    expect(await app.transaction(async () => "done")).toBe("done");
    expect(database.transactions).toBe(3);
  });
});
