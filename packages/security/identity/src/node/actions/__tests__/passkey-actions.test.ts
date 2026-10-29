/**
 * Stackra file contract:
 * Purpose: unit tests of the passkey actions: the sign-in pair is anonymous, public and no tool, the registration pair
 *          is the signed-in user's and no tool; a challenge answers the provider's session and options and its
 *          verification the verified session; registration and confirmation act on the caller's own provider user,
 *          audit the passkey id, and refuse a caller the provider does not know.
 * Boundary: test only; the memory identity provider driver stands in for ZITADEL.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; ADR 0206 (decision 8); STA-1538.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { ChallengePasskeyAction } from "#node/actions/challenge-passkey.action";
import { ConfirmPasskeyAction } from "#node/actions/confirm-passkey.action";
import { RegisterPasskeyAction } from "#node/actions/register-passkey.action";
import { VerifyPasskeyAction } from "#node/actions/verify-passkey.action";
import { ChallengePasskeyInput } from "#node/schemas/challenge-passkey-input.schema";
import { ConfirmPasskeyInput } from "#node/schemas/confirm-passkey-input.schema";
import { RegisterPasskeyInput } from "#node/schemas/register-passkey-input.schema";
import { VerifyPasskeyInput } from "#node/schemas/verify-passkey-input.schema";

const CREDENTIAL = { id: "c_1", rawId: "c_1", type: "public-key", response: {} } as const;

/** A provider holding the fake context's actor as `rana`. */
async function setup() {
  const idp = new MemoryIdpAdminDriver();
  const ctx = fakeActionContext();
  const userId = await idp.createUser({
    organizationId: "org_1",
    username: "rana",
    givenName: "Rana",
    familyName: "Haddad",
    email: "rana@acme.example",
    stackraUserId: ctx.actor.id,
  });
  return { idp, ctx, userId };
}

describe("passkey actions", () => {
  it("keeps sign-in anonymous and public, registration the user's, and none a tool", () => {
    for (const kind of [ChallengePasskeyAction, VerifyPasskeyAction]) {
      const options = kindOf(kind)?.options;
      expect(options?.["actors"]).toEqual([ActorKind.Anonymous]);
      expect(options?.["area"]).toBe(ApiArea.Public);
      expect(options?.["tool"]).toBe(false);
    }
    for (const kind of [RegisterPasskeyAction, ConfirmPasskeyAction]) {
      const options = kindOf(kind)?.options;
      expect(options?.["actors"]).toEqual([ActorKind.User]);
      expect(options?.["tool"]).toBe(false);
    }
  });

  it("challenges a login and verifies the credential on its session", async () => {
    const { idp } = await setup();
    const challenge = await new ChallengePasskeyAction(idp).handle(
      ChallengePasskeyInput.create({ loginName: "rana" }),
    );
    expect(challenge.options.challenge).toBeTypeOf("string");
    const verified = await new VerifyPasskeyAction(idp).handle(
      VerifyPasskeyInput.create({ sessionId: challenge.sessionId, credential: CREDENTIAL }),
    );
    expect(verified.sessionId).toBe(challenge.sessionId);
    expect(verified.sessionToken).not.toBe("");
  });

  it("registers and confirms a passkey on the caller's own provider user", async () => {
    const { idp, ctx, userId } = await setup();
    const { passkeyId } = await new RegisterPasskeyAction(idp).handle(
      RegisterPasskeyInput.create({}),
      ctx,
    );
    const confirmed = await new ConfirmPasskeyAction(idp).handle(
      ConfirmPasskeyInput.create({ passkeyId, name: "iPhone", credential: CREDENTIAL }),
      ctx,
    );
    expect(confirmed.passkeyId).toBe(passkeyId);
    expect(idp.passkeys.get(passkeyId)).toEqual({ userId, name: "iPhone" });
    expect(ctx.recorded.audit).toEqual({ passkeyId });
  });

  it("refuses a caller the provider does not know", async () => {
    const idp = new MemoryIdpAdminDriver();
    await expect(
      new RegisterPasskeyAction(idp).handle(RegisterPasskeyInput.create({}), fakeActionContext()),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
