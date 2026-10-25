/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySessionStoreDriver`: its one account signs in and out, it may start signed in, it never
 *          has a token, and with no account a sign-in is cancelled.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";

import { SessionStore } from "#contracts/ports/session-store.port";
import type { SessionUser } from "#contracts/types/session-user.type";
import { MemorySessionStoreDriver } from "#core/drivers/memory-session-store.driver";
import { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";

/** The account. */
const USER: SessionUser = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: [],
  tenants: [],
};

describe("MemorySessionStoreDriver", () => {
  it("is a SessionStore that signs its account in and out", async () => {
    const store = new MemorySessionStoreDriver(USER);
    expect(store).toBeInstanceOf(SessionStore);
    expect(await store.load()).toBeNull();
    await store.signIn();
    expect(await store.load()).toBe(USER);
    await store.signOut();
    expect(await store.load()).toBeNull();
  });

  it("may start signed in, and never has a token", async () => {
    const store = new MemorySessionStoreDriver(USER, true);
    expect(await store.load()).toBe(USER);
    expect(await store.accessToken()).toBeUndefined();
  });

  it("cancels a sign-in with no account", async () => {
    const store = new MemorySessionStoreDriver();
    await expect(store.signIn()).rejects.toBeInstanceOf(SignInCancelledError);
    expect(await store.load()).toBeNull();
  });
});
