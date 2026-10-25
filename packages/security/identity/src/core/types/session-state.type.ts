/**
 * Stackra file contract:
 * Purpose: `SessionState`, one snapshot of a client's session as the `SessionService` holds it: the status, and the
 *          user when signed in.
 * Boundary: a type only, a union on `status`, so `state.status === SessionStatus.SignedIn` narrows `user` to a
 *           `SessionUser`; every other status has `user: null`, so `state.user ?? null` reads without narrowing.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0338 (decision 4); ADR 0294 (decision 8).
 */
import type { SessionUser } from "#contracts/types/session-user.type";
import type { SessionStatus } from "#core/enums/session-status.enum";

/**
 * The session's state.
 *
 * @example
 * const state = session.current();
 * if (state.status === SessionStatus.SignedIn) greet(state.user.displayName);
 */
export type SessionState =
  | { readonly status: typeof SessionStatus.SignedIn; readonly user: SessionUser }
  | {
      readonly status: Exclude<SessionStatus, typeof SessionStatus.SignedIn>;
      readonly user: null;
    };
