/**
 * Stackra file contract:
 * Purpose: unit tests of `DATABASE_TESTING_PLUGIN`: `.seed(...)` runs each seeder in its own transaction when the
 *          module compiles, `app.transaction(work)` runs work in a transaction of the connected database, a compile
 *          with no database connects a fresh memory one (replacing the one an earlier module left, keeping any other),
 *          and `app.repository(Model)` hands out the model's repository.
 * Boundary: test only; the database is a stand-in that counts transactions, and the module is an empty one. The
 *           memory database is built but never queried, so PGlite does not start.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3); ADR 0190; ADR 0022.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Module } from "@stackra/container";
import { createTestingModule } from "@stackra/container/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { CrudService } from "#core/bases/crud-service.base";
import { Seeder } from "#core/bases/seeder.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { modelOf } from "#core/functions/model-of.function";
import { Database } from "#core/ports/database.port";
import { DATABASE_TESTING_PLUGIN } from "#testing/constants/database-testing-plugin.constant";
import { MemoryDatabaseDriver } from "#testing/drivers/memory-database.driver";

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

class Widget {}

afterEach(async () => {
  await ACTIVE_DATABASE.current?.close();
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

  it("connects a fresh memory database per module and keeps one connected another way", async () => {
    await createTestingModule(FixtureModule).compile();
    const first = Database.current();
    expect(first).toBeInstanceOf(MemoryDatabaseDriver);
    await createTestingModule(FixtureModule).compile();
    expect(Database.current()).toBeInstanceOf(MemoryDatabaseDriver);
    expect(Database.current()).not.toBe(first);

    const counting = new CountingDatabase();
    ACTIVE_DATABASE.current = counting;
    await createTestingModule(FixtureModule).compile();
    await createTestingModule(FixtureModule).compile();
    expect(Database.current()).toBe(counting);
  });

  it("hands out the model's repository", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const widgets = app.repository(Widget);
    expect(widgets).toBeInstanceOf(CrudService);
    expect(modelOf(widgets.constructor)).toBe(Widget);
  });
});
