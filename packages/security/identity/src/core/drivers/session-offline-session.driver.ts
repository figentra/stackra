/**
 * Stackra file contract:
 * Purpose: `SessionOfflineSessionDriver`, the `OfflineSession` of `@stackra/query`'s offline stores: whether the
 *          device's session is revoked (`SessionStatus.Revoked`, the signal `OfflineLock` wipes the `outbox`, `cache`
 *          and `secrets` areas on) or signed in (what unlocks the device again), and the local sign-out the lock ends
 *          the session with when the offline limit passes without a sync (ADR 0338 decision 4).
 * Boundary: the identity side of the query package's port (that package reads no session). Both signals are read from
 *           `SessionService` and tell their listeners only when their value changes. `end` signs out through the
 *           target's store and resolves even when the provider cannot be told: the session is signed out here either
 *           way, and the wipe that called it has already taken the stored credentials.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 4); ADR 0206 (decision 9); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { OfflineSession } from "@stackra/query/contracts";

import { SessionStatus } from "#core/enums/session-status.enum";
import { SessionService } from "#core/services/session.service";

/**
 * The session as the offline stores need it.
 *
 * @example
 * const offline = new SessionOfflineSessionDriver(sessionService);
 * offline.isRevoked.subscribe((isRevoked) => isRevoked && lock.wipe());
 */
export class SessionOfflineSessionDriver extends Driver(OfflineSession) {
  /** True while the provider refuses the device's session. */
  readonly isRevoked: OfflineSession["isRevoked"];

  /** True while someone is signed in on the device. */
  readonly isSignedIn: OfflineSession["isSignedIn"];

  /** The session both signals read. */
  private readonly session: SessionService;

  /** @param session - the client's session. */
  constructor(session: SessionService) {
    super();
    this.session = session;
    this.isRevoked = this.statusSignal(SessionStatus.Revoked);
    this.isSignedIn = this.statusSignal(SessionStatus.SignedIn);
  }

  /** Signs out on this device; resolves even when the provider cannot be told. */
  end(): Promise<void> {
    return this.session.signOut().catch(() => undefined);
  }

  /** A signal of whether the session's status is `status`, telling its listeners on each change of that answer. */
  private statusSignal(status: SessionStatus): OfflineSession["isRevoked"] {
    const get = (): boolean => this.session.status === status;
    return Object.freeze({
      get,
      subscribe: (listener: (value: boolean) => void) => {
        let last = get();
        return this.session.subscribe(() => {
          const next = get();
          if (next === last) return;
          last = next;
          listener(next);
        });
      },
    });
  }
}
