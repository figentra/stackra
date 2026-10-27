/**
 * Stackra file contract:
 * Purpose: `MemorySessionStoreDriver`, the `SessionStore` of tests and previews: one account held in memory that signs
 *          in and out on request.
 * Boundary: nothing survives the instance, and no credential exists, so `accessToken()` is always `undefined`. With no
 *           account (as the container builds it, before `seed`) nobody can sign in, and `signIn` is cancelled.
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
 * const store = new MemorySessionStoreDriver().seed(user);
 * await store.signIn();
 * await store.load(); // user
 */
export class MemorySessionStoreDriver extends Driver(SessionStore) {
  /** The one account that can sign in, or `null`. */
  private account: SessionUser | null = null;

  /** Whether the account is signed in. */
  private signedIn = false;

  /**
   * Sets the account `signIn` signs in, replacing any before.
   *
   * @param account - the account; `null` for none.
   * @param signedIn - whether it starts signed in.
   * @returns this store, to chain.
   */
  seed(account: SessionUser | null, signedIn = false): this {
    this.account = account;
    this.signedIn = signedIn && account !== null;
    return this;
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
