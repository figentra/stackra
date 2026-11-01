/**
 * Stackra file contract:
 * Purpose: unit tests of `provideDatabaseUrl` and `databaseUrl`: a provided url is read back, a later one replaces
 *          it, and reading before anything was provided throws an error that names the missing `./database` import.
 * Boundary: test only; resets the host after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238; STA-1652.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { DATABASE_URL_HOST } from "#node/constants/database-url-host.constant";
import { databaseUrl } from "#node/functions/database-url.function";
import { provideDatabaseUrl } from "#node/functions/provide-database-url.function";

afterEach(() => {
  DATABASE_URL_HOST.url = undefined;
});

describe("databaseUrl", () => {
  it("reads the provided url", () => {
    provideDatabaseUrl("postgres://encore/billing");
    expect(databaseUrl()).toBe("postgres://encore/billing");
  });

  it("returns the latest provided url", () => {
    provideDatabaseUrl("postgres://encore/one");
    provideDatabaseUrl("postgres://encore/two");
    expect(databaseUrl()).toBe("postgres://encore/two");
  });

  it("throws, naming the missing import, when nothing was provided", () => {
    expect(() => databaseUrl()).toThrow('import "./database"');
  });
});
