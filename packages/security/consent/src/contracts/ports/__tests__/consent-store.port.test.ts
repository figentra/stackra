/**
 * Stackra file contract:
 * Purpose: type and shape tests of the `ConsentStore` port: an abstract port class whose three members are
 *          synchronous, and a driver of it is an instance of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 17).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConsentStore } from "#contracts/ports/consent-store.port";
import type { ConsentRecord } from "#contracts/types/consent-record.type";

/** The smallest driver of the port. */
class NothingStoredDriver extends Driver(ConsentStore) {
  read(): ConsentRecord | null {
    return null;
  }

  write(): void {}

  clear(): void {}
}

describe("ConsentStore", () => {
  it("is a port, and its drivers are instances of it", () => {
    const store = new NothingStoredDriver();
    expect(store).toBeInstanceOf(ConsentStore);
    expect(store).toBeInstanceOf(Port);
    expect(store.read()).toBeNull();
  });

  it("types its members as synchronous", () => {
    expectTypeOf<ConsentStore["read"]>().returns.toEqualTypeOf<ConsentRecord | null>();
    expectTypeOf<ConsentStore["write"]>().parameters.toEqualTypeOf<[ConsentRecord]>();
    // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: asserts the port's exact `void` return
    expectTypeOf<ConsentStore["write"]>().returns.toEqualTypeOf<void>();
    // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: asserts the port's exact `void` return
    expectTypeOf<ConsentStore["clear"]>().returns.toEqualTypeOf<void>();
  });
});
