/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresOfflineCapStoreDriver`: it is the `OfflineCapStore` port; `usage` deletes the calls
 *          older than the window, then sums the rest by bound device, action and instant; `record` inserts one call.
 * Boundary: test only; a stand-in entity manager records each statement, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 5); ADR 0160.
 */
import { OfflineCapStore } from "@stackra/actions/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { PostgresOfflineCapStoreDriver } from "#node/drivers/postgres-offline-cap-store.driver";

function database() {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const db = {
    em: () => ({
      execute: async (sql: string, params: readonly unknown[] = []) => {
        statements.push({ sql, params });
        return sql.startsWith("select") ? [{ count: "2", amount: "3500" }] : [];
      },
    }),
  } as unknown as Database;
  return { db, statements };
}

describe(PostgresOfflineCapStoreDriver, () => {
  it("prunes the older calls and sums the window", async () => {
    const { db, statements } = database();
    const store = new PostgresOfflineCapStoreDriver(db);
    expect(store).toBeInstanceOf(OfflineCapStore);
    const since = new Date("2026-10-24T09:00:00.000Z");
    expect(await store.usage("dev_1", "gift_cards.gift_card.redeem@1", since)).toEqual({
      count: 2,
      amount: 3500,
    });
    expect(statements.map((statement) => statement.sql.split(" ")[0])).toEqual([
      "delete",
      "select",
    ]);
    for (const statement of statements)
      expect(statement.params).toEqual(["dev_1", "gift_cards.gift_card.redeem@1", since]);
  });

  it("records one call", async () => {
    const { db, statements } = database();
    const at = new Date();
    await new PostgresOfflineCapStoreDriver(db).record("dev_1", "k@1", at, 2500);
    expect(statements[0]?.params).toEqual(["dev_1", "k@1", at, 2500]);
  });
});
