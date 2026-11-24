/**
 * Stackra file contract:
 * Purpose: unit tests of the container-built `PostgresDatabaseDriver`: an instance made with no ORM (what the container
 *          builds for the `Database` port) is a handle on the connected driver, and until one is connected every use of it,
 *          `orm`, `em`, `detached` and `close`, fails with the one clear "No database is connected" error.
 * Boundary: unit tier, no Postgres: `ACTIVE_DATABASE` is the only state, set and cleared by each test. The connected case,
 *           where the handle reaches the real connection, is the integration test beside this one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238 (one logical database per service); STA-1652 (the generated
 *                     boot connects the database).
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import type { Database } from "#core/ports/database.port";
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";

const NOT_CONNECTED = /No database is connected/;

beforeEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

/** The handle the container builds. */
describe("a PostgresDatabaseDriver built with no ORM", () => {
  /** Nothing connected: the error says what to do. */
  it("fails every use with the not-connected error while no database is connected", async () => {
    const handle = new PostgresDatabaseDriver();
    expect(() => handle.orm).toThrow(NOT_CONNECTED);
    expect(() => handle.em()).toThrow(NOT_CONNECTED);
    expect(() => handle.detached()).toThrow(NOT_CONNECTED);
    await expect(handle.close()).rejects.toThrow(NOT_CONNECTED);
  });

  /** Something else is "current" (another driver kind, a stand-in): that is not a Postgres connection. */
  it("does not take another kind of database for its connection", () => {
    ACTIVE_DATABASE.current = { em: () => undefined } as unknown as Database;
    expect(() => new PostgresDatabaseDriver().orm).toThrow(NOT_CONNECTED);
  });

  /** A handle never becomes the connection itself: a handle that is "current" is no connection either. */
  it("does not take another handle for the connection", () => {
    const first = new PostgresDatabaseDriver();
    ACTIVE_DATABASE.current = first;
    expect(() => new PostgresDatabaseDriver().orm).toThrow(NOT_CONNECTED);
    expect(() => first.orm).toThrow(NOT_CONNECTED);
  });
});
