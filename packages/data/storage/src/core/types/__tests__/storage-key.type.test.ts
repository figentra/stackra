/**
 * Stackra file contract:
 * Purpose: type tests of `StorageKey`: a derived key and an optional area from `StorageArea`, so a made-up area is
 *          refused.
 * Boundary: test only; type assertions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import { StorageArea } from "#core/enums/storage-area.enum";
import type { StorageKey } from "#core/types/storage-key.type";

describe("StorageKey", () => {
  it("takes a key and an optional area", () => {
    expectTypeOf({ key: "console.ui" }).toExtend<StorageKey>();
    expectTypeOf({ key: "console.ui", area: StorageArea.Prefs }).toExtend<StorageKey>();
    expectTypeOf({ key: "console.ui", area: "disk" as const }).not.toExtend<StorageKey>();
  });
});
