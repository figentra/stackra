/**
 * Stackra file contract:
 * Purpose: unit tests of `seederLedger`: both its read and its write name the ledger table with its schema
 *          (`"database"."seed_records"`, where migration 0003 creates it), under the pack `seeder:<member>` and kind
 *          `seeder`, so `stackra db seed` finds the table off the search path.
 * Boundary: test only; the connected database is a stand-in that records the SQL it is given.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0396 (decision 1); STA-1709; STA-2840.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import type { Database } from "#core/ports/database.port";
import { seederLedger } from "#node/functions/seeder-ledger.function";

/** The statements the stand-in database was given. */
let statements: { sql: string; params: readonly unknown[] }[];

beforeEach(() => {
  statements = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[]) => {
      statements.push({ sql, params });
      return sql.startsWith("select") ? [{ key: "notes.demo", hash: "h1" }] : [];
    },
  };
  ACTIVE_DATABASE.current = { em: () => em } as unknown as Database;
});

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe("seederLedger", () => {
  it("reads and records seeder runs in the schema-qualified ledger table", async () => {
    const ledger = seederLedger();
    expect(await ledger.applied("orders")).toEqual(new Map([["notes.demo", "h1"]]));
    await ledger.record("orders", {
      key: "notes.demo",
      profile: "demo",
      checksum: "h2",
      ranBy: "dev",
    } as Parameters<ReturnType<typeof seederLedger>["record"]>[1]);

    expect(statements).toHaveLength(2);
    for (const { sql } of statements) {
      expect(sql).toContain('"database"."seed_records"');
      expect(sql).not.toMatch(/(?:from|into) seed_records/);
    }
    expect(statements[0]?.params).toEqual(["seeder:orders", "seeder"]);
    expect(statements[1]?.params.slice(0, 6)).toEqual([
      "seeder:orders",
      "seeder",
      "notes.demo",
      "demo",
      "seeder",
      "h2",
    ]);
  });
});
