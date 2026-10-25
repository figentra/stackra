/**
 * Stackra file contract:
 * Purpose: the `OfflineSession` port: what the offline stores need from the device's session (ADR 0338 decision 4):
 *          whether identity has revoked it, whether someone is signed in (a new sign-in is what unlocks a wiped
 *          device), and a way to end it here once the offline limit wiped the device.
 * Boundary: an abstract class that is its own token, keyed `query.OfflineSession`. `@stackra/identity` implements it
 *           over its `SessionService`, because identity depends on this package and never the reverse. Both signals
 *           notify on change only. `end` signs the device out locally even when the provider cannot be reached, so
 *           only a new sign-in unlocks it.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 4); ADR 0206 (decision 8: the session's states); ADR 0294 (decisions 15 and
 *                     16).
 */
import { Port } from "@stackra/contracts";
import type { ReadonlySignal } from "@stackra/platform/contracts";

/**
 * The device's session, as the offline stores see it.
 *
 * @example
 * export class SessionOfflineSessionDriver extends Driver(OfflineSession) {
 *   readonly isRevoked = statusSignal(this.session, SessionStatus.Revoked);
 *   readonly isSignedIn = statusSignal(this.session, SessionStatus.SignedIn);
 *   end() {
 *     return this.session.signOut();
 *   }
 * }
 */
export abstract class OfflineSession extends Port {
  /** Type-only port key, so `DriverName<OfflineSession>` narrows to this port's drivers. */
  declare readonly "~key": "query.OfflineSession";

  /** True while identity reports the device's session revoked; the stores wipe when it turns true. */
  abstract readonly isRevoked: ReadonlySignal<boolean>;

  /** True while someone is signed in on the device; a sign-in after a wipe is what lets it sync and unlock. */
  abstract readonly isSignedIn: ReadonlySignal<boolean>;

  /** Ends the session on this device; resolves even when the provider cannot be told. */
  abstract end(): Promise<void>;
}
