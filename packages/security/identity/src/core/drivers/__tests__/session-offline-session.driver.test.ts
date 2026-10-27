/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionOfflineSessionDriver`: it is the query package's `OfflineSession`; `isRevoked` turns
 *          true when the provider refuses the session and `isSignedIn` follows sign-in and sign-out, each telling its
 *          listeners only on a change; `end` signs out and resolves even when the provider cannot be told.
 * Boundary: test only; the session is the real `SessionService` over a memory store that can be revoked or fail.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import { PermissionSnapshotService } from "@stackra/iam";
import { OfflineSession } from "@stackra/query/contracts";
import { ActiveScopeService } from "@stackra/scope";
import { TenantSwitcher } from "@stackra/tenancy";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import type { SessionUser } from "#contracts/types/session-user.type";
import { MemorySessionStoreDriver } from "#core/drivers/memory-session-store.driver";
import { SessionOfflineSessionDriver } from "#core/drivers/session-offline-session.driver";
import { SessionStatus } from "#core/enums/session-status.enum";
import { SessionRevokedError } from "#core/errors/session-revoked.error";
import { SessionService } from "#core/services/session.service";

const USER: SessionUser = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: [],
  memberships: [],
};

/** A memory store the provider can revoke, or whose sign-out cannot reach the provider. */
class TestStoreDriver extends MemorySessionStoreDriver {
  isRevoked = false;

  isUnreachable = false;

  override async load(): Promise<SessionUser | null> {
    if (this.isRevoked) throw SessionRevokedError.create();
    return super.load();
  }

  override async signOut(): Promise<void> {
    await super.signOut();
    if (this.isUnreachable) throw new Error("provider unreachable");
  }
}

/** A started, signed-in session over a test store, and the driver under test. */
async function setup() {
  const store = new TestStoreDriver(USER, true);
  const session = new SessionService(
    buildConfig(IdentityConfig),
    store,
    new TenantSwitcher(new ActiveScopeService()),
    new PermissionSnapshotService(),
  );
  await session.start();
  return { store, session, driver: new SessionOfflineSessionDriver(session) };
}

describe("SessionOfflineSessionDriver", () => {
  it("is the query package's OfflineSession and reads the session's status", async () => {
    const { driver } = await setup();
    expect(driver).toBeInstanceOf(OfflineSession);
    expect(driver.isSignedIn.get()).toBe(true);
    expect(driver.isRevoked.get()).toBe(false);
  });

  it("turns isRevoked on when the provider refuses the session, telling listeners once per change", async () => {
    const { store, session, driver } = await setup();
    const revoked: boolean[] = [];
    const signedIn: boolean[] = [];
    driver.isRevoked.subscribe((value) => revoked.push(value));
    const stop = driver.isSignedIn.subscribe((value) => signedIn.push(value));
    store.isRevoked = true;
    await session.refresh();
    await session.refresh();
    expect(session.status).toBe(SessionStatus.Revoked);
    expect(revoked).toEqual([true]);
    expect(signedIn).toEqual([false]);
    store.isRevoked = false;
    stop();
    await session.signIn();
    expect(driver.isRevoked.get()).toBe(false);
    expect(revoked).toEqual([true, false]);
    expect(signedIn).toEqual([false]);
  });

  it("ends the session on the device even when the provider cannot be told", async () => {
    const { store, session, driver } = await setup();
    store.isUnreachable = true;
    await expect(driver.end()).resolves.toBeUndefined();
    expect(session.status).toBe(SessionStatus.SignedOut);
    expect(driver.isSignedIn.get()).toBe(false);
  });
});
