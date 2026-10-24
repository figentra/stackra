/**
 * Stackra file contract:
 * Purpose: type tests of `StoredRecord<T>`: the state reads back as part of `T` or `undefined`, and a write takes part
 *          of `T` only.
 * Boundary: test only; type assertions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0079 (persisted stores).
 */
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { StoredRecord } from "#contracts/types/stored-record.type";

interface Preferences {
  tenantByUser: Record<string, string>;
}

describe("StoredRecord", () => {
  it("reads and writes part of the state", () => {
    expectTypeOf<StoredRecord<Preferences>["read"]>().returns.toEqualTypeOf<
      Partial<Preferences> | undefined
    >();
    expectTypeOf<StoredRecord<Preferences>["write"]>().toBeCallableWith({ tenantByUser: {} });
    // @ts-expect-error -- a field the state does not have is refused
    expectTypeOf<StoredRecord<Preferences>["write"]>().toBeCallableWith({ other: 1 });
  });
});
