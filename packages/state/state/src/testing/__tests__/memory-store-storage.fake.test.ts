/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryStoreStorage`: one area object per name, separate areas, `undefined` for a missing key,
 *          values copied through JSON both ways.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0256.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryStoreStorage } from "#testing/memory-store-storage.fake";

describe("MemoryStoreStorage", () => {
  it("returns one area per name and keeps areas apart", () => {
    const storage = new MemoryStoreStorage();
    expect(storage.area("prefs")).toBe(storage.area("prefs"));
    storage.area("prefs").set("console.ui", { density: "compact" });
    expect(storage.area("session").get("console.ui")).toBeUndefined();
    expect(storage.area("prefs").get("console.ui")).toEqual({ density: "compact" });
  });

  it("copies values through JSON on the way in and out", () => {
    const area = new MemoryStoreStorage().area("prefs");
    const value = { tenantByUser: { usr_1: "ten_2" }, at: new Date("2026-10-24T00:00:00.000Z") };
    area.set("mobile.preferences", value);
    value.tenantByUser.usr_1 = "ten_9";
    const read = area.get("mobile.preferences") as {
      tenantByUser: Record<string, string>;
      at: unknown;
    };
    expect(read).toEqual({ tenantByUser: { usr_1: "ten_2" }, at: "2026-10-24T00:00:00.000Z" });
    read.tenantByUser["usr_1"] = "ten_7";
    expect(area.get("mobile.preferences")).toMatchObject({ tenantByUser: { usr_1: "ten_2" } });
  });
});
