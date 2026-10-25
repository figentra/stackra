/**
 * Stackra file contract:
 * Purpose: `SessionValue`, what `useSession()` returns: the session's state with its two actions, sign in and sign out.
 * Boundary: a type only, a union on `status` like `SessionState`, so checking `status` narrows `user`; every status
 *           carries `user` (`null` unless signed in), so `session.user ?? null` reads without narrowing. The actions
 *           are the `SessionService`'s, so a fake session's spies are what a page calls.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0294 (decision 8); ADR 0295 (decision 10).
 */
import type { SessionState } from "#core/index";

/**
 * The session in a component.
 *
 * @example
 * const session = useSession();
 * if (session.status !== SessionStatus.SignedIn) return <SignIn onPress={() => session.signIn()} />;
 * return <Avatar name={session.user.displayName} />;
 */
export type SessionValue = SessionState & {
  /**
   * Runs the target's sign-in (the hosted page in the system browser, or the BFF login).
   *
   * @throws SignInCancelledError when the user stopped it.
   */
  readonly signIn: () => Promise<void>;

  /** Ends the session here and at the provider. */
  readonly signOut: () => Promise<void>;
};
