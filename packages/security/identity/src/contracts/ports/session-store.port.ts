/**
 * Stackra file contract:
 * Purpose: the `SessionStore` port: where a client's session comes from and goes, one driver per flow. On the web it is
 *          the BFF's HttpOnly cookie session (`BffSessionStoreDriver`), on a device the authorization-code flow with
 *          PKCE and its tokens in the `secrets` storage area (`PkceSessionStoreDriver`), in a test memory
 *          (`MemorySessionStoreDriver`).
 * Boundary: an abstract class that is its own token, keyed `identity.SessionStore`; gen's wiring picks the driver per
 *           target from `IdentityConfig.flow`. A driver keeps the credential and never shows it to app code: the
 *           access token leaves only through `accessToken()`, which the `ClientSession` driver turns into a header.
 *           The session's state and its listeners are the `SessionService`'s, so no driver repeats them.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8: BFF on the web, PKCE on devices); ADR 0277 (desktop sign-in); ADR 0294
 *                     (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { SessionUser } from "#contracts/types/session-user.type";

/**
 * The session of one flow.
 *
 * @example
 * export class MemorySessionStoreDriver extends Driver(SessionStore) {
 *   async load() { return this.signedIn ? this.account : null; }
 *   async signIn() { this.signedIn = true; }
 *   async signOut() { this.signedIn = false; }
 *   async accessToken() { return undefined; }
 * }
 */
export abstract class SessionStore extends Port {
  /** Type-only port key, so `DriverName<SessionStore>` narrows to this port's drivers. */
  declare readonly "~key": "identity.SessionStore";

  /**
   * The signed-in user, renewing an expiring credential first; `null` when signed out.
   *
   * @throws SessionRevokedError when the provider refused the device's session (revoked, or past its lifetime).
   */
  abstract load(): Promise<SessionUser | null>;

  /**
   * Runs the flow's sign-in. A device resolves once the tokens are kept; the web leaves the page for the hosted sign-in
   * and never resolves.
   *
   * @throws SignInCancelledError when the user closed the hosted sign-in.
   */
  abstract signIn(): Promise<void>;

  /** Ends the session here and at the provider; nothing happens when signed out. */
  abstract signOut(): Promise<void>;

  /** The access token for the next call, renewed when it expires; `undefined` when the flow sends none (a cookie). */
  abstract accessToken(): Promise<string | undefined>;
}
