// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionService`: it starts loading and reads the store once; a signed-in user's memberships
 *          reach the tenant switcher; a read failure leaves it signed out and is seen by the first caller only; a
 *          revoked session becomes `revoked`; sign-in is loading while it runs and a cancellation restores the state;
 *          sign-out always ends signed out; a refused token revokes; the idle rule signs out a quiet client; a window
 *          coming back into view reads the session again; `current()` is a stable snapshot and subscribers hear every
 *          change; the signed-in user's permission keys reach IAM's snapshot and leave it on sign-out.
 * Boundary: test only; jsdom for the window listeners, fake timers for the idle rule, and a scripted store.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); ADR 0210 (decision 3); ADR 0338 (decision 4).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Driver } from "@stackra/container";
import { PermissionSnapshotService } from "@stackra/iam";
import { ActiveScopeService } from "@stackra/scope";
import { TenantSwitcher } from "@stackra/tenancy";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { IdentityConfig } from "#config/identity.config";
import { SessionStore } from "#contracts/ports/session-store.port";
import type { SessionUser } from "#contracts/types/session-user.type";
import { SessionStatus } from "#core/enums/session-status.enum";
import { SessionRevokedError } from "#core/errors/session-revoked.error";
import { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";
import { SessionService } from "#core/services/session.service";

/** A user with one membership. */
const USER: SessionUser = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: ["orders.order.read"],
  memberships: [
    {
      tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
      path: "platform.acme",
      name: "Acme",
      role: "admin",
      roles: ["admin"],
    },
  ],
};

/** A store whose answers and failures a test sets. */
class ScriptedStoreDriver extends Driver(SessionStore) {
  /** The signed-in user. */
  user: SessionUser | null = null;

  /** What each member throws, when set. */
  fails: Partial<Record<"load" | "signIn" | "signOut" | "accessToken", unknown>> = {};

  /** How many times the session was read. */
  reads = 0;

  async load(): Promise<SessionUser | null> {
    this.reads += 1;
    if (this.fails.load !== undefined) throw this.fails.load;
    return this.user;
  }

  async signIn(): Promise<void> {
    if (this.fails.signIn !== undefined) throw this.fails.signIn;
    this.user = USER;
  }

  async signOut(): Promise<void> {
    this.user = null;
    if (this.fails.signOut !== undefined) throw this.fails.signOut;
  }

  async accessToken(): Promise<string | undefined> {
    if (this.fails.accessToken !== undefined) throw this.fails.accessToken;
    return this.user === null ? undefined : "access-1";
  }
}

/** A service over a scripted store, with its switcher and permission snapshot. */
function setup(values: Partial<ConfigValues<IdentityConfig>> = {}) {
  const store = new ScriptedStoreDriver();
  const switcher = new TenantSwitcher(new ActiveScopeService());
  const permissions = new PermissionSnapshotService();
  const session = new SessionService(
    buildConfig(IdentityConfig, { values }),
    store,
    switcher,
    permissions,
  );
  return { store, switcher, permissions, session };
}

describe("SessionService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts loading, reads the store once, and hands the memberships to the switcher", async () => {
    const { store, switcher, session } = setup();
    store.user = USER;
    expect(session.status).toBe(SessionStatus.Loading);
    expect(session.user).toBeNull();
    await Promise.all([session.start(), session.start()]);
    expect(store.reads).toBe(1);
    expect(session.status).toBe(SessionStatus.SignedIn);
    expect(session.user).toBe(USER);
    expect(switcher.memberships()).toEqual(USER.memberships);
    expect(switcher.current()?.tenantId).toBe("scp_01j9z3k4m5n6p7q8r9s0t1v2w4");
  });

  it("keeps one snapshot until a change and tells every subscriber", async () => {
    const { store, session } = setup();
    store.user = USER;
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);
    await session.start();
    const snapshot = session.current();
    expect(session.current()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await session.signOut();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(session.current()).not.toBe(snapshot);
  });

  it("sets the signed-in user's permission keys into IAM's snapshot, and empties it on sign-out", async () => {
    const { store, permissions, session } = setup();
    store.user = USER;
    expect(permissions.current()).toEqual([]);
    await session.start();
    expect(permissions.current()).toEqual(["orders.order.read"]);
    expect(permissions.can("orders.order.read")).toBe(true);
    await session.signOut();
    expect(permissions.current()).toEqual([]);
  });

  it("boots signed out on a read failure, which only the first caller sees", async () => {
    const { store, session } = setup();
    const failure = new TypeError("network down");
    store.fails.load = failure;
    await expect(session.start()).rejects.toBe(failure);
    await expect(session.start()).resolves.toBeUndefined();
    expect(session.status).toBe(SessionStatus.SignedOut);
  });

  it("turns a revoked session into revoked, with nothing to report", async () => {
    const { store, switcher, session } = setup();
    store.fails.load = SessionRevokedError.create();
    await expect(session.start()).resolves.toBeUndefined();
    expect(session.status).toBe(SessionStatus.Revoked);
    expect(session.user).toBeNull();
    expect(switcher.memberships()).toEqual([]);
  });

  it("is loading while signing in, then signed in", async () => {
    const { session } = setup();
    await session.start();
    const signingIn = session.signIn();
    expect(session.status).toBe(SessionStatus.Loading);
    await signingIn;
    expect(session.status).toBe(SessionStatus.SignedIn);
    expect(session.user).toBe(USER);
  });

  it("restores the state when the sign-in is cancelled", async () => {
    const { store, session } = setup();
    await session.start();
    store.fails.signIn = SignInCancelledError.create();
    await expect(session.signIn()).rejects.toBeInstanceOf(SignInCancelledError);
    expect(session.status).toBe(SessionStatus.SignedOut);
  });

  it("ends signed out even when the provider cannot be reached", async () => {
    const { store, switcher, session } = setup();
    store.user = USER;
    await session.start();
    const failure = new TypeError("network down");
    store.fails.signOut = failure;
    await expect(session.signOut()).rejects.toBe(failure);
    expect(session.status).toBe(SessionStatus.SignedOut);
    expect(switcher.memberships()).toEqual([]);
  });

  it("hands out the token, and revokes when the provider refuses it", async () => {
    const { store, session } = setup();
    store.user = USER;
    await session.start();
    expect(await session.accessToken()).toBe("access-1");
    store.fails.accessToken = SessionRevokedError.create();
    expect(await session.accessToken()).toBeUndefined();
    expect(session.status).toBe(SessionStatus.Revoked);
  });

  it("passes on a token failure that is not a revocation", async () => {
    const { store, session } = setup();
    store.fails.accessToken = new TypeError("network down");
    await expect(session.accessToken()).rejects.toBeInstanceOf(TypeError);
  });

  it("signs out a client left idle, and activity restarts the countdown", async () => {
    vi.useFakeTimers();
    const { store, session } = setup({ idleMinutes: 30 });
    store.user = USER;
    await session.start();
    await vi.advanceTimersByTimeAsync(29 * 60_000);
    session.touch();
    await vi.advanceTimersByTimeAsync(29 * 60_000);
    expect(session.status).toBe(SessionStatus.SignedIn);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(session.status).toBe(SessionStatus.SignedOut);
  });

  it("counts a key press as activity", async () => {
    vi.useFakeTimers();
    const { store, session } = setup({ idleMinutes: 30 });
    store.user = USER;
    await session.start();
    await vi.advanceTimersByTimeAsync(29 * 60_000);
    document.dispatchEvent(new KeyboardEvent("keydown"));
    await vi.advanceTimersByTimeAsync(29 * 60_000);
    expect(session.status).toBe(SessionStatus.SignedIn);
  });

  it("never signs out for idling without an idle rule", async () => {
    vi.useFakeTimers();
    const { store, session } = setup();
    store.user = USER;
    await session.start();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60_000);
    expect(session.status).toBe(SessionStatus.SignedIn);
  });

  it("reads the session again when the window comes back into view", async () => {
    const { store, session } = setup();
    store.user = USER;
    await session.start();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    store.user = null;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(session.status).toBe(SessionStatus.SignedOut));
  });
});
