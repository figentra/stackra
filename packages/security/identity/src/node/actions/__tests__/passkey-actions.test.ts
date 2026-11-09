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
import { Idempotency } from "@stackra/actions";
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, AssuranceLevel } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";

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

/** Each key with its value's type, nested, so two answers compare by shape only. */
function shape(value: unknown): unknown {
  return typeof value === "object" && value !== null
    ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
    : typeof value;
}

const CONFIG = buildConfig(IdentityConfig);

/** A provider holding the fake context's actor as `rana`, signed in `minutesAgo` at `level` (a fresh password). */
async function setup(level: AssuranceLevel = AssuranceLevel.Aal1, minutesAgo = 1) {
  const idp = new MemoryIdpAdminDriver();
  const base = fakeActionContext();
  const ctx = fakeActionContext({
    actor: base.actor,
    assurance: {
      amr: ["pwd"],
      authTime: new Date(base.now().getTime() - minutesAgo * 60_000),
      level,
    },
  });
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

/** Registers then confirms a passkey for the context's user. */
async function enrol(idp: MemoryIdpAdminDriver, ctx: ReturnType<typeof fakeActionContext>) {
  const { passkeyId } = await new RegisterPasskeyAction(idp).handle(
    RegisterPasskeyInput.create({}),
    ctx,
  );
  return new ConfirmPasskeyAction(idp, CONFIG).handle(
    ConfirmPasskeyInput.create({ passkeyId, name: "Laptop", credential: CREDENTIAL }),
    ctx,
  );
}

describe("passkey actions", () => {
  it("keeps sign-in anonymous, public and never replayed, registration the user's, and none a tool", () => {
    for (const kind of [ChallengePasskeyAction, VerifyPasskeyAction]) {
      const options = kindOf(kind)?.options;
      expect(options?.["actors"]).toEqual([ActorKind.Anonymous]);
      expect(options?.["area"]).toBe(ApiArea.Public);
      // a challenge is single-use and a verification answers session credentials: neither is ever kept or replayed
      expect(options?.["idempotency"]).toBe(Idempotency.Never);
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

  it("answers an unknown login the same shape as a known one, and never verifies it", async () => {
    const { idp } = await setup();
    const challenge = new ChallengePasskeyAction(idp);
    const known = await challenge.handle(ChallengePasskeyInput.create({ loginName: "rana" }));
    const unknown = await challenge.handle(ChallengePasskeyInput.create({ loginName: "nobody" }));
    expect(shape(unknown)).toEqual(shape(known));
    expect(unknown.sessionId.length).toBe(known.sessionId.length);
    expect(unknown.options.challenge.length).toBe(known.options.challenge.length);
    await expect(
      new VerifyPasskeyAction(idp).handle(
        VerifyPasskeyInput.create({ sessionId: unknown.sessionId, credential: CREDENTIAL }),
      ),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("registers and confirms a passkey on the caller's own provider user", async () => {
    const { idp, ctx, userId } = await setup();
    const { passkeyId } = await new RegisterPasskeyAction(idp).handle(
      RegisterPasskeyInput.create({}),
      ctx,
    );
    const confirmed = await new ConfirmPasskeyAction(idp, CONFIG).handle(
      ConfirmPasskeyInput.create({ passkeyId, name: "iPhone", credential: CREDENTIAL }),
      ctx,
    );
    expect(confirmed.passkeyId).toBe(passkeyId);
    expect(idp.passkeys.get(passkeyId)).toEqual({ userId, name: "iPhone" });
    expect(ctx.recorded.audit).toEqual({ passkeyId, firstFactor: true });
  });

  it("enrols the first passkey from a fresh one-factor sign-in, without AAL2 (STA-340)", async () => {
    const { idp, ctx } = await setup(AssuranceLevel.Aal1, 1);
    await expect(enrol(idp, ctx)).resolves.toBeDefined();
    expect(ctx.recorded.audit).toMatchObject({ firstFactor: true });
  });

  it("refuses a second strong factor without AAL2, and keeps it with AAL2", async () => {
    const { idp, ctx, userId } = await setup(AssuranceLevel.Aal1, 1);
    idp.authMethods.set(userId, ["pwd", "hwk"]);
    await expect(enrol(idp, ctx)).rejects.toMatchObject({ code: "step_up_required" });
    const stepped = await setup(AssuranceLevel.Aal2, 1);
    stepped.idp.authMethods.set(stepped.userId, ["pwd", "hwk"]);
    await expect(enrol(stepped.idp, stepped.ctx)).resolves.toBeDefined();
    expect(stepped.ctx.recorded.audit).toMatchObject({ firstFactor: false });
  });

  it("refuses even the first passkey from a stale sign-in", async () => {
    const { idp, ctx } = await setup(AssuranceLevel.Aal1, CONFIG.stepUpMaxAgeMinutes + 1);
    await expect(enrol(idp, ctx)).rejects.toMatchObject({ code: "step_up_required" });
  });

  it("asks the pipeline for no step-up, only the first-factor enrolment exemption", () => {
    expect(kindOf(ConfirmPasskeyAction)?.options).toMatchObject({
      stepUp: { exempt: "first-factor-enrolment" },
    });
  });

  it("refuses a caller the provider does not know", async () => {
    const idp = new MemoryIdpAdminDriver();
    await expect(
      new RegisterPasskeyAction(idp).handle(RegisterPasskeyInput.create({}), fakeActionContext()),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
