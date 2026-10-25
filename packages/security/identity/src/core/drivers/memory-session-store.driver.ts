/**
 * Stackra file contract:
 * Purpose: `MemorySessionStoreDriver`, the `SessionStore` of tests and previews: one account held in memory that signs
 *          in and out on request.
 * Boundary: nothing survives the instance, and no credential exists, so `accessToken()` is always `undefined`. With no
 *           account (the no-argument form the testing module builds) nobody can sign in, and `signIn` is cancelled.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0294 (decisions 16 and 17).
 */
import { Driver } from "@stackra/container";

import { SessionStore } from "#contracts/ports/session-store.port";
import type { SessionUser } from "#contracts/types/session-user.type";
import { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";

/**
 * A session in memory.
 *
 * @example
 * const store = new MemorySessionStoreDriver(user);
 * await store.signIn();
 * await store.load(); // user
 */
export class MemorySessionStoreDriver extends Driver(SessionStore) {
  /** The one account that can sign in, or `null`. */
  private readonly account: SessionUser | null;

  /** Whether the account is signed in. */
  private signedIn: boolean;

  /**
   * @param account - the account `signIn` signs in; `null` for none.
   * @param signedIn - whether it starts signed in.
   */
  constructor(account: SessionUser | null = null, signedIn = false) {
    super();
    this.account = account;
    this.signedIn = signedIn && account !== null;
  }

  /** The account while signed in, else `null`. */
  async load(): Promise<SessionUser | null> {
    return this.signedIn ? this.account : null;
  }

  /**
   * Signs the account in.
   *
   * @throws SignInCancelledError when there is no account.
   */
  async signIn(): Promise<void> {
    if (this.account === null) throw SignInCancelledError.create();
    this.signedIn = true;
  }

  /** Signs the account out. */
  async signOut(): Promise<void> {
    this.signedIn = false;
  }

  /** No credential exists in memory. */
  async accessToken(): Promise<string | undefined> {
    return undefined;
  }
}
