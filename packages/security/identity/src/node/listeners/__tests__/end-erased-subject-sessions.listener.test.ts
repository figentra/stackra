/**
 * Stackra file contract:
 * Purpose: unit tests of `EndErasedSubjectSessionsListener`: after `SubjectErased`, every provider session of the
 *          subject ends, its provider user is removed, and another user's stay; a subject the provider does not know
 *          ends nothing and is logged by erasure id.
 * Boundary: test only; the memory identity provider driver stands in for ZITADEL.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0189 (decision 2); STA-1543.
 */
import { Logger } from "@stackra/contracts";
import { Listener } from "@stackra/events";
import type { ListenerContext } from "@stackra/events";
import { SubjectErased } from "@stackra/privacy";
import { describe, expect, Fake, it } from "@stackra/testing";

import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { EndErasedSubjectSessionsListener } from "#node/listeners/end-erased-subject-sessions.listener";

/** The erasure receipt of `subject`. */
function erased(subject: string): SubjectErased {
  return SubjectErased.create({
    erasureId: "era_1",
    subject,
    erased: [],
    kept: [],
    shredded: true,
    at: "2026-10-29T12:00:00.000Z",
  });
}

/** Records every log line; the methods are left to the spies (`declare` satisfies the abstract members). */
class LoggerFake extends Fake.of(Logger) {
  declare debug: Logger["debug"];

  declare info: Logger["info"];

  declare warn: Logger["warn"];

  declare error: Logger["error"];
}

/** A provider with the erased user (two sessions) and another (one session). */
async function setup() {
  const idp = new MemoryIdpAdminDriver();
  const person = { organizationId: "org_1", givenName: "R", familyName: "H" };
  const erasedUser = await idp.createUser({
    ...person,
    username: "rana",
    email: "rana@acme.example",
    stackraUserId: "usr_1",
  });
  const other = await idp.createUser({
    ...person,
    username: "omar",
    email: "omar@acme.example",
    stackraUserId: "usr_2",
  });
  idp.openSession(erasedUser);
  idp.openSession(erasedUser);
  const kept = idp.openSession(other);
  const logger = new LoggerFake();
  const listener = new EndErasedSubjectSessionsListener(idp, logger);
  return { idp, erasedUser, other, kept, logger, listener };
}

describe(EndErasedSubjectSessionsListener, () => {
  it("is a listener", async () => {
    expect((await setup()).listener).toBeInstanceOf(Listener);
  });

  it("ends every provider session of the erased subject only and removes its user", async () => {
    const { idp, erasedUser, other, kept, logger, listener } = await setup();
    await listener.handle(erased("usr_1"), {} as ListenerContext);
    expect([...idp.sessions.keys()]).toEqual([kept]);
    expect([...idp.users.keys()]).toEqual([other]);
    expect(idp.users.has(erasedUser)).toBe(false);
    expect(await idp.findUserId("usr_1")).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("ends nothing for a subject the provider does not know, and logs the erasure", async () => {
    const { idp, logger, listener } = await setup();
    await listener.handle(erased("usr_9"), {} as ListenerContext);
    expect(idp.sessions.size).toBe(3);
    expect(idp.users.size).toBe(2);
    expect(logger.warn).toHaveBeenCalledWith("identity.erasure.no_provider_user", {
      erasureId: "era_1",
    });
  });
});
