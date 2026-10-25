/**
 * Stackra file contract:
 * Purpose: `SignedInSession`, the session once a user is signed in: what a page that needs a user reads after checking
 *          the status, and what `fakeSession({ status: SessionStatus.SignedIn })` returns.
 * Boundary: a type only, the signed-in member of `SessionValue`, so `SignedInSession["user"]` is the `SessionUser`.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0208; ADR 0294 (decision 8).
 */
import type { SessionStatus } from "#core/index";
import type { SessionValue } from "#react/session/session-value.type";

/**
 * A signed-in session.
 *
 * @example
 * export interface ProfileState {
 *   readonly user: SignedInSession["user"];
 * }
 */
export type SignedInSession = Extract<
  SessionValue,
  { readonly status: typeof SessionStatus.SignedIn }
>;
