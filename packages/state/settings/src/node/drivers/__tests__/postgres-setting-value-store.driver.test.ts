/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresSettingValueStoreDriver`: a `SettingValueStore` that hands each chain row on as a
 *          layer, stores a write whose keys no holder above locks, and refuses a locked one without storing, while a
 *          holder's own lock never refuses its own write.
 * Boundary: test only; the service is a stand-in over fixed rows, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 2); ADR 0327 (decisions 3 and 9).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SettingValueStore } from "#contracts/index";
import { SettingsLockedError } from "#core/index";
import { PostgresSettingValueStoreDriver } from "#node/drivers/postgres-setting-value-store.driver";
import { StoredSetting } from "#node/models/stored-setting.model";
import type { StoredSettingService } from "#node/services/stored-setting.service";

const PLATFORM: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** A node row at `scope`. */
const rowAt = (scope: ScopeRef, values: Record<string, unknown>, locked: string[]): StoredSetting =>
  Object.assign(new StoredSetting(), {
    groupKey: "orders",
    scopeId: scope.id,
    scopePath: scope.path,
    userId: null,
    values,
    locked,
  });

/** The driver over `rows`, with a recording `store`. */
function driverOver(rows: StoredSetting[]) {
  const store = vi.fn(async () => rows[0]);
  const settings = { chainOf: async () => rows, store } as unknown as StoredSettingService;
  return { driver: new PostgresSettingValueStoreDriver(settings), store };
}

describe(PostgresSettingValueStoreDriver, () => {
  it("is a SettingValueStore", () => {
    expect(driverOver([]).driver).toBeInstanceOf(SettingValueStore);
  });

  it("hands each chain row on as a layer", async () => {
    const { driver } = driverOver([rowAt(PLATFORM, { a: 1 }, ["a"])]);
    await expect(driver.layers("orders", { scope: ACME })).resolves.toEqual([
      { values: { a: 1 }, locked: ["a"] },
    ]);
  });

  it("stores a write no holder above locks", async () => {
    const { driver, store } = driverOver([rowAt(PLATFORM, { a: 1 }, ["a"])]);
    await driver.write("orders", { scope: ACME }, { b: 2 }, ["b"]);
    expect(store).toHaveBeenCalledWith("orders", { scope: ACME }, { b: 2 }, ["b"]);
  });

  it("refuses a key locked above without storing", async () => {
    const { driver, store } = driverOver([rowAt(PLATFORM, { a: 1 }, ["a"])]);
    await expect(driver.write("orders", { scope: ACME }, { a: 2 })).rejects.toBeInstanceOf(
      SettingsLockedError,
    );
    expect(store).not.toHaveBeenCalled();
  });

  it("lets a holder change its own locked value", async () => {
    const { driver, store } = driverOver([rowAt(PLATFORM, { a: 1 }, ["a"])]);
    await driver.write("orders", { scope: PLATFORM }, { a: 2 });
    expect(store).toHaveBeenCalledTimes(1);
  });
});
