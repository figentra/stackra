/**
 * Stackra file contract:
 * Purpose: unit tests of the `Database` port: `Database.current()` returns the connected driver and says what to do
 *          when none is connected; `onReplica` runs the work as it is on a driver with no replica.
 * Boundary: test only; the driver is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0014; ADR 0238; ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";

class StandInDatabase extends Database {
  em(): EntityManager {
    throw new Error("not used");
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
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

describe("Database", () => {
  it("returns the connected database", () => {
    const database = new StandInDatabase();
    ACTIVE_DATABASE.current = database;
    expect(Database.current()).toBe(database);
  });

  it("runs replica work in the running context by default", async () => {
    expect(await new StandInDatabase().onReplica(async () => "read")).toBe("read");
  });

  it("refuses before a database is connected", () => {
    expect(() => Database.current()).toThrow(/No database is connected/);
  });
});
