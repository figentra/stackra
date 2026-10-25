/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/storage`
 *          (`OfflineStore`, `StorageArea`) and the registry row's memory driver and key registration are exported,
 *          nothing else is, `Storage` is not (it is exported from `./contracts` only), and the public type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as storage from "#core/index";
import type { StorageKey } from "#core/index";

describe("@stackra/storage", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(storage).sort()).toEqual([
      "MemoryPayloadSealDriver",
      "MemoryStorageDriver",
      "OfflineStore",
      "StorageArea",
      "WebCryptoPayloadSealDriver",
      "registerStorageKeys",
    ]);
    expect("Storage" in storage).toBe(false);
  });

  it("resolves its public type", () => {
    expectTypeOf<StorageKey["area"]>().toEqualTypeOf<storage.StorageArea | undefined>();
  });
});
