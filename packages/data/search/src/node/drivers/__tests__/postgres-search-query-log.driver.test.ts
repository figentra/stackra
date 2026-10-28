/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresSearchQueryLogDriver`: it is a `SearchQueryLog`, `store` binds every value,
 *          `popular` completes a prefix, and the reports bind their window and check it.
 * Boundary: test only; a stand-in entity manager records each statement, so no database runs; `record` is the
 *           subclass's (@stackra/data-maintenance). The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0160; stackra-326.
 */
import type { PublicId } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { SearchQueryLog } from "#contracts/index";
import { PostgresSearchQueryLogDriver } from "#node/drivers/postgres-search-query-log.driver";

const SCOPE = { id: "scp_1" as PublicId<"scp">, path: "platform.shop" };

/** The abstract driver with a `record` that does nothing. */
class TestSearchQueryLogDriver extends PostgresSearchQueryLogDriver {
  /** Not under test here. */
  async record(): Promise<void> {}
}

/** A driver over a recording entity manager; the manager answers `rows`. */
function driverWith(rows: readonly object[] = []) {
  const statements: { readonly sql: string; readonly params: readonly unknown[] }[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[]) => {
      statements.push({ sql, params });
      return rows;
    },
  };
  const driver = new TestSearchQueryLogDriver({ em: () => em } as unknown as Database);
  return { driver, statements };
}

describe(PostgresSearchQueryLogDriver, () => {
  it("stores a row of the scope with every value bound", async () => {
    const { driver, statements } = driverWith();
    expect(driver).toBeInstanceOf(SearchQueryLog);
    await driver.store(SCOPE, { model: "Product", phrase: "linen", clicked: "prd_1" });
    expect(statements[0]?.sql).toContain(`insert into "search"."queries"`);
    expect(statements[0]?.params).toEqual([
      "scp_1",
      "platform.shop",
      "Product",
      "linen",
      null,
      null,
      "prd_1",
    ]);
  });

  it("completes a prefix from the phrases that found rows", async () => {
    const { driver, statements } = driverWith([{ phrase: "linen shirt" }]);
    expect(await driver.popular("Product", "lin", 500)).toEqual(["linen shirt"]);
    expect(statements[0]?.params).toEqual(["Product", "lin", "lin", 30, 100]);
  });

  it("reports over a checked window", async () => {
    const { driver, statements } = driverWith([
      { phrase: "lamp", searches: "4", zero: "4", clicks: "0" },
    ]);
    expect(await driver.zeroResults({ model: "Product", days: 7 })).toEqual([
      { phrase: "lamp", searches: 4, zero: 4, clicks: 0 },
    ]);
    expect(statements[0]?.sql).toContain(`having count(*) filter (where "hits" = 0) > 0`);
    expect(statements[0]?.params).toEqual([7, "Product", 20]);
    await driver.top();
    await driver.clickThrough({ limit: 5 });
    expect(statements[2]?.params).toEqual([30, 5]);
    await expect(driver.top({ days: 0 })).rejects.toThrow(RangeError);
    await expect(driver.top({ limit: 101 })).rejects.toThrow(RangeError);
  });
});
