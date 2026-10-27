/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionFake`: it starts in the status it was given, `start()` reads nothing (a loading fake
 *          stays loading), the fake user has the requested memberships, and its actions are spies.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SessionService, SessionStatus } from "#core/index";
import { SessionFake } from "#testing/session.fake";

describe("SessionFake", () => {
  it("stays in its status when started", async () => {
    const session = new SessionFake({ status: SessionStatus.Loading });
    await session.start();
    expect(session).toBeInstanceOf(SessionService);
    expect(session.status).toBe(SessionStatus.Loading);
  });

  it("signs in a user with the requested memberships", () => {
    const session = new SessionFake({ status: SessionStatus.SignedIn, memberships: 3 });
    expect(session.user?.memberships.map((membership) => membership.path)).toEqual([
      "platform.fake.member_1",
      "platform.fake.member_2",
      "platform.fake.member_3",
    ]);
  });

  it("has spies for its actions", () => {
    const session = new SessionFake();
    expect(vi.isMockFunction(session.signIn)).toBe(true);
    expect(vi.isMockFunction(session.signOut)).toBe(true);
  });
});
