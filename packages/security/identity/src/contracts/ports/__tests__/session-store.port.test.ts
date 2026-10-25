/**
 * Stackra file contract:
 * Purpose: type and shape tests of the `SessionStore` port: an abstract port class whose four members are
 *          asynchronous, and a driver of it is an instance of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 17); ADR 0206 (decision 8).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SessionStore } from "#contracts/ports/session-store.port";
import type { SessionUser } from "#contracts/types/session-user.type";

/** The smallest driver of the port: always signed out. */
class SignedOutDriver extends Driver(SessionStore) {
  async load(): Promise<SessionUser | null> {
    return null;
  }

  async signIn(): Promise<void> {}

  async signOut(): Promise<void> {}

  async accessToken(): Promise<string | undefined> {
    return undefined;
  }
}

describe("SessionStore", () => {
  it("is a port, and its drivers are instances of it", async () => {
    const store = new SignedOutDriver();
    expect(store).toBeInstanceOf(SessionStore);
    expect(store).toBeInstanceOf(Port);
    expect(await store.load()).toBeNull();
    expect(await store.accessToken()).toBeUndefined();
  });

  it("types its members as asynchronous", () => {
    expectTypeOf<SessionStore["load"]>().returns.toEqualTypeOf<Promise<SessionUser | null>>();
    expectTypeOf<SessionStore["signIn"]>().returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf<SessionStore["signOut"]>().returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf<SessionStore["accessToken"]>().returns.toEqualTypeOf<
      Promise<string | undefined>
    >();
  });
});
