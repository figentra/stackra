/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresHoldRegistryDriver`: no ids ask nothing; a live hold on the model's record or on a
 *          subject a row links to holds that row, a hold on another model's record of the same id does not; each
 *          refusal is logged once, and nothing is logged when nothing is held.
 * Boundary: test only; the database is a stand-in whose entity manager records the SQL and answers the hold rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0134 (holds); data-layer gap gov20 (stackra-332).
 */
import type { Database } from "@stackra/database";
import { Disposal } from "@stackra/database/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PostgresHoldRegistryDriver } from "#node/drivers/postgres-hold-registry.driver";

class Invoice {}

/** A driver over an entity manager answering `holds` and recording each statement. */
function driver(holds: readonly { model: string; record_id: string }[]) {
  const executed: [string, readonly unknown[]][] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[]) => {
      executed.push([sql, params]);
      return sql.startsWith("select") ? holds : [];
    },
  };
  const database = { em: () => em } as unknown as Database;
  return { registry: new PostgresHoldRegistryDriver(database), executed };
}

describe("PostgresHoldRegistryDriver", () => {
  it("asks nothing for no ids", async () => {
    const { registry, executed } = driver([]);
    expect(await registry.heldAmong(Invoice, [], Disposal.Purge)).toEqual(new Set());
    expect(executed).toEqual([]);
  });

  it("holds a record held directly or through a linked subject, and logs each refusal", async () => {
    const { registry, executed } = driver([
      { model: "Invoice", record_id: "inv_1" },
      { model: "Customer", record_id: "cus_9" },
      { model: "Order", record_id: "inv_3" },
    ]);
    const held = await registry.heldAmong(
      Invoice,
      ["inv_1", "inv_2", "inv_3", "inv_4"],
      Disposal.Retention,
      { inv_2: { customerId: "cus_9" }, inv_4: { customerId: "cus_8" } },
    );
    expect(held).toEqual(new Set(["inv_1", "inv_2"]));
    expect(executed[0]?.[0]).toContain("released_at is null and record_id in (?, ?, ?, ?, ?, ?)");
    expect(executed[0]?.[1]).toEqual(["inv_1", "inv_2", "inv_3", "inv_4", "cus_9", "cus_8"]);
    expect(executed[1]?.[0]).toContain('insert into "privacy"."legal_hold_refusals"');
    expect(executed[1]?.[1]).toEqual([
      "Invoice",
      "inv_1",
      "retention",
      "Invoice",
      "inv_2",
      "retention",
    ]);
  });

  it("logs nothing when nothing is held", async () => {
    const { registry, executed } = driver([]);
    expect(await registry.heldAmong(Invoice, ["inv_1"], Disposal.Delete)).toEqual(new Set());
    expect(executed).toHaveLength(1);
  });
});
