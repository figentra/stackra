/**
 * Stackra file contract:
 * Purpose: type tests of `InAppStore`: a port (abstract, `Port`-branded) whose three methods each name the recipient,
 *          implemented by a driver with `Driver(InAppStore)` that TypeScript makes implement all three.
 * Boundary: test only; the behaviour of a store is tested on `InAppStoreFake` in `./testing`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 16 and 17); ADR 0305 (rule 8).
 */
import { Driver } from "@stackra/container";
import { Port, type PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InAppStore } from "#contracts/ports/in-app-store.port";
import type { InAppEntry } from "#contracts/types/in-app-entry.type";
import type { InAppMessage } from "#contracts/types/in-app-message.type";

class EmptyInAppStoreDriver extends Driver(InAppStore) {
  append(_recipient: PublicId<"usr">, message: InAppMessage): Promise<InAppEntry> {
    return Promise.resolve({ ...message, id: "inm_1", createdAt: new Date(0), readAt: null });
  }

  list(): Promise<readonly InAppEntry[]> {
    return Promise.resolve([]);
  }

  markRead(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

describe("InAppStore", () => {
  it("is a port a driver implements", async () => {
    const driver = new EmptyInAppStoreDriver();
    expect(driver).toBeInstanceOf(InAppStore);
    expect(driver).toBeInstanceOf(Port);
    const entry = await driver.append("usr_1", { product: "pos", kind: "order_paid", data: {} });
    expect(entry.readAt).toBeNull();
  });

  it("names the recipient in every method", () => {
    expectTypeOf<Parameters<InAppStore["append"]>[0]>().toEqualTypeOf<PublicId<"usr">>();
    expectTypeOf<Parameters<InAppStore["list"]>[0]>().toEqualTypeOf<PublicId<"usr">>();
    expectTypeOf<Parameters<InAppStore["markRead"]>[0]>().toEqualTypeOf<PublicId<"usr">>();
    expectTypeOf<NonNullable<Parameters<InAppStore["list"]>[1]>>().toHaveProperty("product");
    expectTypeOf<InAppMessage>().toHaveProperty("product").toEqualTypeOf<string>();
    expectTypeOf<InAppStore["markRead"]>().returns.toEqualTypeOf<Promise<boolean>>();
    // @ts-expect-error a driver must implement append, list and markRead
    class Empty extends Driver(InAppStore) {}
    expect(Empty).toBeTypeOf("function");
  });
});
