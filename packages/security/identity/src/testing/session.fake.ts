/**
 * Stackra file contract:
 * Purpose: `SessionFake`, the session `fakeSession` returns: a real `SessionService` over a memory store, already in the
 *          status the test asked for, whose `signIn` and `signOut` are spies.
 * Boundary: test code only. It starts in its status synchronously and `start()` reads nothing, so its state changes only
 *           through its own calls. By default `signIn` signs the fake user in and `signOut` signs out, through the real
 *           service; a test's own function replaces either. The fake user is `usr_…01`, `user@example.test`, with the
 *           requested number of memberships `scp_…01`, `scp_…02`, … (role `admin`). It takes no constructor argument
 *           (gen reads every constructor parameter as an injected class); `seed` sets the status. It is a
 *           `SessionService`, so a
 *           render helper binds it with `.override(SessionService, session)`; its own `status`, `user`, `signIn` and
 *           `signOut` give it the shape of a session value.
 * Runtime: node
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

/** The fake user, with `memberships` memberships. */
function fakeUser(memberships: number): SessionUser {
  return {
    userId: `usr_${idBody(1)}`,
    email: "user@example.test",
    displayName: "Test User",
    permissions: [],
    memberships: Array.from({ length: memberships }, (_, index) => ({
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
 * const session = new SessionFake().seed({ status: SessionStatus.SignedIn, memberships: 2 });
 * session.user?.memberships.length; // 2
 */
export class SessionFake extends SessionService {
  /** The memory store under the fake; `seed` gives it the fake user. */
  private readonly memory: MemorySessionStoreDriver;

  /** A signed-out fake with one membership; `seed` puts it in another status. */
  constructor() {
    const memory = new MemorySessionStoreDriver();
    super(
      buildConfig(IdentityConfig),
      memory,
      new TenantSwitcher(new ActiveScopeService()),
      new PermissionSnapshotService(),
    );
    this.memory = memory;
    this.seed();
  }

  /**
   * Puts the fake in the status a test needs, with the fake user and fresh spies for its actions.
   *
   * @param options - the status, the memberships and the actions' stand-ins.
   * @returns this fake, to chain.
   */
  seed(options: FakeSessionOptions = {}): this {
    const account = fakeUser(options.memberships ?? 1);
    const status = options.status ?? SessionStatus.SignedOut;
    this.memory.seed(account, status === SessionStatus.SignedIn);
    this.set(
      status === SessionStatus.SignedIn ? { status, user: account } : { status, user: null },
    );
    this.signIn = vi.fn(options.signIn ?? (() => super.signIn()));
    this.signOut = vi.fn(options.signOut ?? (() => super.signOut()));
    return this;
  }

  /** Reads nothing: the fake starts in its status and changes only through its own calls. */
  override start(): Promise<void> {
    return Promise.resolve();
  }
}
