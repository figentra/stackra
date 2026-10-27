/**
 * Stackra file contract:
 * Purpose: `fakeSession(options)`, the session a test starts from: handed to a render helper
 *          (`renderRoute(..., { session })`) or bound in place of `SessionService`; the test reads the user and asserts
 *          on the `signIn` and `signOut` spies through it.
 * Boundary: test code only. Typed as the value `useSession()` returns, `SignedInSession` when the status is signed in,
 *           so `session.user.memberships` reads without narrowing; at run time it is a `SessionFake`, a real
 *           `SessionService`. Two calls never share state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing); ADR 0266; ADR 0206.
 */
import type { SessionStatus } from "#core/index";
import type { SessionValue, SignedInSession } from "#react/index";
import { SessionFake } from "#testing/session.fake";
import type { FakeSessionOptions } from "#testing/types/fake-session-options.type";

/**
 * A signed-in fake session.
 *
 * @example
 * const session = fakeSession({ status: SessionStatus.SignedIn, memberships: 2 });
 * const [first, second] = session.user.memberships;
 */
export function fakeSession(
  options: FakeSessionOptions & { readonly status: typeof SessionStatus.SignedIn },
): SignedInSession;

/**
 * A fake session in any other status; signed out when left out.
 *
 * @example
 * const session = fakeSession({
 *   status: SessionStatus.SignedOut,
 *   signIn: () => Promise.reject(SignInCancelledError.create()),
 * });
 * renderRoute(Routes.sign_in, { locale: "en", session });
 * expect(session.signIn).toHaveBeenCalled();
 */
export function fakeSession(options?: FakeSessionOptions): SessionValue;

/** The implementation behind the overloads above. */
export function fakeSession(options: FakeSessionOptions = {}): SessionValue {
  // The fake's own `status`, `user`, `signIn` and `signOut` are a session value's shape at run time.
  return new SessionFake(options) as unknown as SessionValue;
}
