/**
 * Stackra file contract:
 * Purpose: type tests of `DataKey`: an id and raw key bytes, both required and readonly.
 * Boundary: test only; the assertions are compile-time plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { DataKey } from "#core/types/data-key.type";

describe("DataKey", () => {
  it("is an id and the key bytes", () => {
    const key: DataKey = { id: "k1", key: new Uint8Array([1, 2, 3]) };
    expect(key.key).toHaveLength(3);
    expectTypeOf<DataKey["id"]>().toEqualTypeOf<string>();
    expectTypeOf<DataKey["key"]>().toEqualTypeOf<Uint8Array>();
    // @ts-expect-error -- the key bytes are required
    const noBytes: DataKey = { id: "k1" };
    expect(noBytes.id).toBe("k1");
  });
});
