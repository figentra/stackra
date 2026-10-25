/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StorageArea`: the six areas of ADR 0256 in order, snake_case codes, the type of the
 *          same name, and every code naming the `Storage` property that holds the area.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0256 (decision 2); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Storage } from "#contracts/ports/storage.port";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";
import { StorageArea } from "#core/enums/storage-area.enum";

describe("StorageArea", () => {
  it("has the six areas of ADR 0256", () => {
    expect(Enum.values(StorageArea)).toEqual([
      "prefs",
      "session",
      "cache",
      "outbox",
      "secrets",
      "files",
    ]);
    expect(StorageArea.Prefs).toBe("prefs");
    expectTypeOf<StorageArea>().toEqualTypeOf<
      "prefs" | "session" | "cache" | "outbox" | "secrets" | "files"
    >();
  });

  it("names a property of the Storage port with every code", () => {
    expectTypeOf<StorageArea>().toExtend<keyof Storage>();
    const storage = new MemoryStorageDriver();
    for (const area of Enum.values(StorageArea)) expect(storage[area].keys()).toEqual([]);
  });
});
