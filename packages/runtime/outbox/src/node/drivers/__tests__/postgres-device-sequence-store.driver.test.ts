/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresDeviceSequenceStoreDriver`: it is the `DeviceSequenceStore` port; `last` reads the
 *          device's row by a bound id and maps its scope; `settle` is one upsert that only moves upward, every value
 *          bound.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 1); ADR 0160.
 */
import { DeviceSequenceStore } from "@stackra/actions/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { PostgresDeviceSequenceStoreDriver } from "#node/drivers/postgres-device-sequence-store.driver";

function databaseAnswering(rows: readonly object[]) {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const database = {
    em: () => ({
      execute: async (sql: string, params: readonly unknown[] = []) => {
        statements.push({ sql, params });
        return rows;
      },
    }),
  } as unknown as Database;
  return { database, statements };
}

describe(PostgresDeviceSequenceStoreDriver, () => {
  it("reads the last settled call with its scope", async () => {
    const { database, statements } = databaseAnswering([
      {
        device_id: "dev_1",
        sequence: "1729760400000",
        settled_at: "2026-10-25T09:00:00.000Z",
        scope_id: "scp_1",
        scope_path: "platform.acme",
      },
    ]);
    const store = new PostgresDeviceSequenceStoreDriver(database);
    expect(store).toBeInstanceOf(DeviceSequenceStore);
    expect(await store.last("dev_1")).toEqual({
      deviceId: "dev_1",
      sequence: 1_729_760_400_000,
      settledAt: new Date("2026-10-25T09:00:00.000Z"),
      scope: { id: "scp_1", path: "platform.acme" },
    });
    expect(statements[0]?.params).toEqual(["dev_1"]);
  });

  it("answers undefined for an unknown device and leaves out a missing scope", async () => {
    expect(
      await new PostgresDeviceSequenceStoreDriver(databaseAnswering([]).database).last("x"),
    ).toBeUndefined();
    const { database } = databaseAnswering([
      { device_id: "d", sequence: 3, settled_at: new Date(0), scope_id: null, scope_path: null },
    ]);
    expect(await new PostgresDeviceSequenceStoreDriver(database).last("d")).not.toHaveProperty(
      "scope",
    );
  });

  it("settles with one upsert that only moves upward", async () => {
    const { database, statements } = databaseAnswering([]);
    const at = new Date("2026-10-25T09:00:00.000Z");
    await new PostgresDeviceSequenceStoreDriver(database).settle("dev_1", 7, at, {
      id: "scp_1",
      path: "platform.acme",
    });
    expect(statements[0]?.sql).toContain("where current.sequence < excluded.sequence");
    expect(statements[0]?.params).toEqual(["dev_1", 7, at, "scp_1", "platform.acme"]);
    await new PostgresDeviceSequenceStoreDriver(database).settle("dev_2", 1, at, undefined);
    expect(statements[1]?.params).toEqual(["dev_2", 1, at, null, null]);
  });
});
