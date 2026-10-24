/**
 * Stackra file contract:
 * Purpose: unit and type tests of `OfflineStore`: the three places the query cache and offline queue can live, with
 *          snake_case codes and the type of the same name the template's desktop config restates.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0256 (decision 3 and the web encryption default).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OfflineStore } from "#core/enums/offline-store.enum";

describe("OfflineStore", () => {
  it("names the places the offline data can live", () => {
    expect(Enum.values(OfflineStore)).toEqual(["encrypted_indexed_db", "sqlite", "memory"]);
    const offlineStore: OfflineStore = OfflineStore.EncryptedIndexedDb;
    expect(offlineStore).toBe("encrypted_indexed_db");
    expectTypeOf<OfflineStore>().toEqualTypeOf<"encrypted_indexed_db" | "sqlite" | "memory">();
  });
});
