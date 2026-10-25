/**
 * Stackra file contract:
 * Purpose: `SessionFake`, the session `fakeSession` returns: a real `SessionService` over a memory store, already in the
 *          status the test asked for, whose `signIn` and `signOut` are spies.
 * Boundary: test code only. It starts in its status synchronously and `start()` reads nothing, so its state changes only
 *           through its own calls. By default `signIn` signs the fake user in and `signOut` signs out, through the real
 *           service; a test's own function replaces either. The fake user is `usr_…01`, `user@example.test`, with the
 *           requested number of memberships `scp_…01`, `scp_…02`, … (role `admin`). It is a `SessionService`, so a
 *           render helper binds it with `.override(SessionService, session)`; its own `status`, `user`, `signIn` and
 *           `signOut` give it the shape of a session value.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3); ADR 0266 (decision 2: a fake per capability); ADR 0206.
 */
import { buildConfig } from "@stackra/config";
import { PermissionSnapshotService } from "@stackra/iam";
import { ActiveScopeService } from "@stackra/scope";
import { TenantSwitcher } from "@stackra/tenancy";
import { vi } from "vitest";

import type { SessionUser } from "#contracts/index";
import {
  IdentityConfig,
  MemorySessionStoreDriver,
  SessionService,
  SessionStatus,
} from "#core/index";
import type { FakeSessionOptions } from "#testing/types/fake-session-options.type";

/** The 26-character id body of the nth fake record (digits are Crockford base32). */
function idBody(n: number): string {
  return String(n).padStart(26, "0");
}

/** The fake user, with `tenants` memberships. */
function fakeUser(tenants: number): SessionUser {
  return {
    userId: `usr_${idBody(1)}`,
    email: "user@example.test",
    displayName: "Test User",
    permissions: [],
    tenants: Array.from({ length: tenants }, (_, index) => ({
      tenantId: `scp_${idBody(index + 1)}`,
      path: `platform.fake.member_${index + 1}`,
      name: `Member ${index + 1}`,
      role: "admin",
      roles: ["admin"],
    })),
  };
}

/**
 * A session in the status a test needs.
 *
 * @example
 * const session = new SessionFake({ status: SessionStatus.SignedIn, tenants: 2 });
 * session.user?.tenants.length; // 2
 */
export class SessionFake extends SessionService {
  /** @param options - the status, the memberships and the actions' stand-ins. */
  constructor(options: FakeSessionOptions = {}) {
    const account = fakeUser(options.tenants ?? 1);
    const status = options.status ?? SessionStatus.SignedOut;
    super(
      buildConfig(IdentityConfig),
      new MemorySessionStoreDriver(account, status === SessionStatus.SignedIn),
      new TenantSwitcher(new ActiveScopeService()),
      new PermissionSnapshotService(),
    );
    this.set(
      status === SessionStatus.SignedIn ? { status, user: account } : { status, user: null },
    );
    this.signIn = vi.fn(options.signIn ?? (() => super.signIn()));
    this.signOut = vi.fn(options.signOut ?? (() => super.signOut()));
  }

  /** Reads nothing: the fake starts in its status and changes only through its own calls. */
  override start(): Promise<void> {
    return Promise.resolve();
  }
}
