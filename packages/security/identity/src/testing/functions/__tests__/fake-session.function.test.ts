/**
 * Stackra file contract:
 * Purpose: unit and type tests of `fakeSession`, written as the template's tests use it: a signed-in fake is typed
 *          `SignedInSession` and lists the requested memberships; a signed-out fake's `signIn` is a spy that signs the
 *          fake user in, or runs the test's stand-in (a cancellation); `signOut` is a spy; it is a `SessionService`
 *          a render helper binds; two fakes share nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0206.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SessionService, SessionStatus, SignInCancelledError } from "#core/index";
import type { SessionValue, SignedInSession } from "#react/index";
import { fakeSession } from "#testing/functions/fake-session.function";

describe("fakeSession", () => {
  it("gives a signed-in session with the requested memberships", () => {
    const session = fakeSession({ status: SessionStatus.SignedIn, memberships: 2 });
    expectTypeOf(session).toEqualTypeOf<SignedInSession>();
    const [first, second] = session.user.memberships;
    expect(session.status).toBe(SessionStatus.SignedIn);
    expect(session.user.userId).toMatch(/^usr_[0-9]{26}$/);
    expect(first?.tenantId).not.toBe(second?.tenantId);
    expect(first?.roles).toEqual(["admin"]);
  });

  it("gives a signed-out session whose signIn signs the fake user in", async () => {
    const session = fakeSession({ status: SessionStatus.SignedOut });
    expectTypeOf(session).toEqualTypeOf<SessionValue>();
    expect(session.user).toBeNull();
    await session.signIn();
    expect(session.signIn).toHaveBeenCalled();
    expect(session.status).toBe(SessionStatus.SignedIn);
  });

  it("runs the test's stand-in, such as a cancelled sign-in", async () => {
    const session = fakeSession({
      status: SessionStatus.SignedOut,
      signIn: () => Promise.reject(SignInCancelledError.create()),
    });
    await expect(session.signIn()).rejects.toBeInstanceOf(SignInCancelledError);
    expect(session.signIn).toHaveBeenCalled();
  });

  it("records the sign-out", async () => {
    const session = fakeSession({ status: SessionStatus.SignedIn });
    await session.signOut();
    expect(session.signOut).toHaveBeenCalled();
    expect(session.status).toBe(SessionStatus.SignedOut);
  });

  it("is a SessionService a render helper binds, starting signed out by default", () => {
    const session = fakeSession();
    expect(session).toBeInstanceOf(SessionService);
    expect(session.status).toBe(SessionStatus.SignedOut);
  });

  it("never shares state between fakes", async () => {
    const one = fakeSession({ status: SessionStatus.SignedIn });
    const two = fakeSession({ status: SessionStatus.SignedIn });
    await one.signOut();
    expect(two.status).toBe(SessionStatus.SignedIn);
  });
});
