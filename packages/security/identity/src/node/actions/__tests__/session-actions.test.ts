/**
 * Stackra file contract:
 * Purpose: unit tests of the session calls: all are no tool, the own-session ones the signed-in user's; listing answers
 *          only the caller's own sessions, and none for a caller the provider does not know; ending one ends only a
 *          session of the caller's and refuses another person's as not found; "sign out everywhere" ends every one of
 *          the caller's and none of anyone else's; a call on someone else's behalf is refused; the administrator's
 *          call ends the named user's sessions, audits the subject and the count, and refuses an unknown subject.
 * Boundary: test only; the memory identity provider driver stands in for ZITADEL.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; ADR 0206; STA-1580.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { ForbiddenError, NotFoundError, UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { EndAllMySessionsAction } from "#node/actions/end-all-my-sessions.action";
import { EndMySessionAction } from "#node/actions/end-my-session.action";
import { EndUserSessionsAction } from "#node/actions/end-user-sessions.action";
import { ListMySessionsQuery } from "#node/queries/list-my-sessions.query";
import { EndMySessionInput } from "#node/schemas/end-my-session-input.schema";
import { EndUserSessionsInput } from "#node/schemas/end-user-sessions-input.schema";
import { SessionsInput } from "#node/schemas/sessions-input.schema";

const NONE = SessionsInput.create({});
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"usr">;
const OTHER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4" as PublicId<"usr">;

/** A user call context for `USER`, acting on behalf of `onBehalfOf` when given. */
function userCtx(onBehalfOf?: PublicId<"usr">) {
  const actor = {
    kind: ActorKind.User,
    id: USER,
    realm: Realm.Staff,
    ...(onBehalfOf === undefined
      ? {}
      : { onBehalfOf: { kind: ActorKind.User, id: onBehalfOf, realm: Realm.Staff } }),
  };
  return fakeActionContext({ actor } as never);
}

/** A provider holding `USER` as `rana` with two sessions, and `OTHER` as `omar` with one. */
async function setup() {
  const idp = new MemoryIdpAdminDriver();
  const ctx = userCtx();
  const person = {
    organizationId: "org_1",
    givenName: "Rana",
    familyName: "Haddad",
    email: "rana@acme.example",
  };
  const userId = await idp.createUser({ ...person, username: "rana", stackraUserId: USER });
  const other = await idp.createUser({ ...person, username: "omar", stackraUserId: OTHER });
  const phone = idp.openSession(userId, "Safari on iOS");
  const laptop = idp.openSession(userId, "Firefox on Linux");
  const foreign = idp.openSession(other);
  return { idp, ctx, phone, laptop, foreign };
}

describe("session actions", () => {
  it("keeps the own-session calls the user's and none of them a tool", () => {
    for (const kind of [ListMySessionsQuery, EndMySessionAction, EndAllMySessionsAction]) {
      const options = kindOf(kind)?.options;
      expect(options?.["actors"]).toEqual([ActorKind.User]);
      expect(options?.["tool"]).toBe(false);
    }
    const admin = kindOf(EndUserSessionsAction)?.options;
    expect(admin?.["actors"]).toEqual([ActorKind.User, ActorKind.Service]);
    expect(admin?.["tool"]).toBe(false);
  });

  it("lists only the caller's own sessions", async () => {
    const { idp, ctx, phone, laptop } = await setup();
    const { sessions } = await new ListMySessionsQuery(idp).handle(NONE, ctx);
    expect(sessions.map((session) => session.sessionId).sort()).toEqual([phone, laptop].sort());
    expect(sessions.find((session) => session.sessionId === phone)?.userAgent).toBe(
      "Safari on iOS",
    );
    const stranger = await new ListMySessionsQuery(new MemoryIdpAdminDriver()).handle(NONE, ctx);
    expect(stranger.sessions).toEqual([]);
  });

  it("ends one of the caller's sessions and refuses another person's", async () => {
    const { idp, ctx, phone, laptop, foreign } = await setup();
    const action = new EndMySessionAction(idp);
    expect(await action.handle(EndMySessionInput.create({ sessionId: phone }), ctx)).toMatchObject({
      ended: 1,
    });
    expect([...idp.sessions.keys()].sort()).toEqual([laptop, foreign].sort());
    await expect(
      action.handle(EndMySessionInput.create({ sessionId: foreign }), ctx),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      action.handle(EndMySessionInput.create({ sessionId: phone }), ctx),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(idp.sessions.has(foreign)).toBe(true);
  });

  it("signs the caller out everywhere and no one else", async () => {
    const { idp, ctx, foreign } = await setup();
    expect(await new EndAllMySessionsAction(idp).handle(NONE, ctx)).toMatchObject({ ended: 2 });
    expect([...idp.sessions.keys()]).toEqual([foreign]);
  });

  it("refuses a call on someone else's behalf and a caller the provider does not know", async () => {
    const { idp, phone } = await setup();
    const ctx = userCtx(OTHER);
    await expect(
      new EndMySessionAction(idp).handle(EndMySessionInput.create({ sessionId: phone }), ctx),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(new EndAllMySessionsAction(idp).handle(NONE, ctx)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      new EndAllMySessionsAction(new MemoryIdpAdminDriver()).handle(NONE, userCtx()),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(idp.sessions.size).toBe(3);
  });

  it("lets an administrator end a user's sessions, audited", async () => {
    const { idp, ctx, phone, laptop } = await setup();
    const action = new EndUserSessionsAction(idp);
    const result = await action.handle(EndUserSessionsInput.create({ subject: OTHER }), ctx);
    expect(result).toMatchObject({ ended: 1 });
    expect([...idp.sessions.keys()].sort()).toEqual([phone, laptop].sort());
    expect(ctx.recorded.audit).toEqual({ subject: OTHER, ended: 1 });
    await expect(
      action.handle(EndUserSessionsInput.create({ subject: "usr_nobody" }), userCtx()),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
