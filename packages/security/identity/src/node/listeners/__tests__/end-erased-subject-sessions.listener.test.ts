/**
 * Stackra file contract:
 * Purpose: unit tests of `EndErasedSubjectSessionsListener`: after `SubjectErased`, every provider session of the
 *          subject ends and another user's stay; a subject the provider does not know ends nothing.
 * Boundary: test only; the memory identity provider driver stands in for ZITADEL.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0189 (decision 2); STA-1543.
 */
import { Listener } from "@stackra/events";
import type { ListenerContext } from "@stackra/events";
import { SubjectErased } from "@stackra/privacy";
import { describe, expect, it } from "@stackra/testing";

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
  return { idp, kept, listener: new EndErasedSubjectSessionsListener(idp) };
}

describe(EndErasedSubjectSessionsListener, () => {
  it("is a listener", async () => {
    expect((await setup()).listener).toBeInstanceOf(Listener);
  });

  it("ends every provider session of the erased subject only", async () => {
    const { idp, kept, listener } = await setup();
    await listener.handle(erased("usr_1"), {} as ListenerContext);
    expect([...idp.sessions.keys()]).toEqual([kept]);
  });

  it("ends nothing for a subject the provider does not know", async () => {
    const { idp, listener } = await setup();
    await listener.handle(erased("usr_9"), {} as ListenerContext);
    expect(idp.sessions.size).toBe(3);
  });
});
