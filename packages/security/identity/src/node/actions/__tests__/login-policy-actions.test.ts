/**
 * Stackra file contract:
 * Purpose: unit tests of the tenant login policy calls: neither is a tool; setting it is a user's or a service's, needs
 *          a fresh `aal2` step-up and derives the L3 `identity.login_policy.set` permission, reading it the L1
 *          `identity.login_policy.read`; the set call forces MFA on the session scope's organisation only, audits the
 *          policy before and after, keeps the lists it leaves out, refuses a lock-out policy or an unconfigured
 *          provider before any provider write, and answers `not_found` for a platform call or a scope with no
 *          organisation; the read answers the organisation's own policy or the inherited default.
 * Boundary: test only; the memory identity provider and organisation drivers stand in for ZITADEL and the identity
 *           service's mapping; the pipeline's permission and step-up checks are covered by @stackra/actions, so here
 *           the declared options are what is asserted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0207 (decision 1); ADR 0410 (decision 4); ADR 0462; STA-2817.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind, AssuranceLevel, Realm } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { IdpSecondFactor, LoginPolicyRejection } from "#contracts/index";
import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { MemoryIdpOrganizationsDriver } from "#core/drivers/memory-idp-organizations.driver";
import { LoginPolicyRejectedError } from "#core/errors/login-policy-rejected.error";
import { LoginPolicyPermissions } from "#node/access/login-policy.permissions";
import { SetLoginPolicyAction } from "#node/actions/set-login-policy.action";
import { ShowLoginPolicyQuery } from "#node/queries/show-login-policy.query";
import { SetLoginPolicyInput } from "#node/schemas/set-login-policy-input.schema";
import { ShowLoginPolicyInput } from "#node/schemas/show-login-policy-input.schema";

const ADMIN = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"usr">;
const ACME = { id: "scp_acme" as PublicId<"scp">, path: "platform.acme" };
const GLOBEX = { id: "scp_globex" as PublicId<"scp">, path: "platform.globex" };

/** Passwords and passkeys, nothing forced, no list. */
const RULES = {
  allowUsernamePassword: true,
  allowRegister: false,
  allowExternalIdp: true,
  forceMfa: false,
  allowPasswordless: true,
  hidePasswordReset: false,
  ignoreUnknownUsernames: true,
};

/** An administrator's call context in `scope`, or a platform call without one (`null`). */
function adminCtx(scope: typeof ACME | null = ACME) {
  return fakeActionContext({
    actor: { kind: ActorKind.User, id: ADMIN, realm: Realm.Staff },
    ...(scope === null ? {} : { scope, scopeId: scope.id }),
  } as never);
}

/** Acme signs in through org_acme, Globex through org_globex; the deployment configures Nafath. */
function setup() {
  const idp = new MemoryIdpAdminDriver();
  const organizations = new MemoryIdpOrganizationsDriver()
    .link(ACME.id, "org_acme")
    .link(GLOBEX.id, "org_globex");
  const config = buildConfig(IdentityConfig, {
    values: { externalProviders: { nafath: "idp_nafath" } },
  });
  return {
    idp,
    set: new SetLoginPolicyAction(idp, organizations, config),
    show: new ShowLoginPolicyQuery(idp, organizations),
  };
}

describe("login policy calls", () => {
  it("declares the set call a step-up L3 call of users and services, and neither a tool", () => {
    const set = kindOf(SetLoginPolicyAction)?.options;
    expect(set?.["key"]).toBe("login_policy.set");
    expect(set?.["actors"]).toEqual([ActorKind.User, ActorKind.Service]);
    expect(set?.["stepUp"]).toBe(AssuranceLevel.Aal2);
    expect(set?.["tool"]).toBe(false);
    const show = kindOf(ShowLoginPolicyQuery)?.options;
    expect(show?.["key"]).toBe("login_policy.read");
    expect(show?.["stepUp"]).toBeUndefined();
    expect(show?.["tool"]).toBe(false);
    expect(LoginPolicyPermissions.set.risk).toBe(Risk.L3);
    expect(LoginPolicyPermissions.read.risk).toBe(Risk.L1);
  });

  it("forces MFA on the session scope's organisation only, audited before and after", async () => {
    const { idp, set } = setup();
    const ctx = adminCtx();
    const result = await set.handle(
      SetLoginPolicyInput.create({
        ...RULES,
        forceMfa: true,
        secondFactors: [IdpSecondFactor.Totp, IdpSecondFactor.U2f],
        externalProviderIds: ["idp_nafath"],
      }),
      ctx,
    );
    const after = {
      ...RULES,
      forceMfa: true,
      externalProviderIds: ["idp_nafath"],
      secondFactors: [IdpSecondFactor.Totp, IdpSecondFactor.U2f],
    };
    expect(result).toEqual(after);
    expect(await idp.getLoginPolicy("org_acme")).toEqual(after);
    expect(idp.policies.has("org_globex")).toBe(false);
    expect(ctx.recorded.audit).toEqual({
      before: { ...idp.defaultPolicy, externalProviderIds: [], secondFactors: [] },
      after,
    });
  });

  it("keeps the providers and factors a later call leaves out", async () => {
    const { idp, set } = setup();
    await set.handle(
      SetLoginPolicyInput.create({ ...RULES, secondFactors: [IdpSecondFactor.Totp] }),
      adminCtx(),
    );
    const ctx = adminCtx();
    const result = await set.handle(SetLoginPolicyInput.create({ ...RULES, forceMfa: true }), ctx);
    expect(result.secondFactors).toEqual([IdpSecondFactor.Totp]);
    expect(result.forceMfa).toBe(true);
    expect((await idp.getLoginPolicy("org_acme")).secondFactors).toEqual([IdpSecondFactor.Totp]);
    expect(ctx.recorded.audit).toMatchObject({
      before: { forceMfa: false, secondFactors: [IdpSecondFactor.Totp] },
      after: { forceMfa: true, secondFactors: [IdpSecondFactor.Totp] },
    });
  });

  it("refuses a lock-out policy or an unconfigured provider before writing anything", async () => {
    const { idp, set } = setup();
    const cases = [
      [{ ...RULES, forceMfa: true }, LoginPolicyRejection.NoSecondFactor],
      [
        { ...RULES, allowUsernamePassword: false, allowPasswordless: false },
        LoginPolicyRejection.NoSignInMethod,
      ],
      [
        { ...RULES, externalProviderIds: ["idp_rogue"] as string[] },
        LoginPolicyRejection.UnknownProvider,
      ],
    ] as const;
    for (const [policy, reason] of cases) {
      const ctx = adminCtx();
      const refused = set.handle(SetLoginPolicyInput.create(policy), ctx);
      await expect(refused).rejects.toBeInstanceOf(LoginPolicyRejectedError);
      await expect(refused).rejects.toMatchObject({ details: { reason } });
      expect(ctx.recorded.audit).toEqual({});
    }
    expect(idp.policies.size).toBe(0);
  });

  it("answers not_found for a platform call or a scope with no organisation", async () => {
    const { idp, set, show } = setup();
    const input = SetLoginPolicyInput.create({ ...RULES, forceMfa: false });
    const unlinked = { id: "scp_new" as PublicId<"scp">, path: "platform.new" };
    for (const ctx of [adminCtx(null), adminCtx(unlinked)]) {
      await expect(set.handle(input, ctx)).rejects.toBeInstanceOf(NotFoundError);
      await expect(show.handle(ShowLoginPolicyInput.create({}), ctx)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    }
    expect(idp.policies.size).toBe(0);
  });

  it("reads the scope's own policy, or the default it inherits", async () => {
    const { idp, set, show } = setup();
    const none = ShowLoginPolicyInput.create({});
    expect(await show.handle(none, adminCtx())).toEqual({
      ...idp.defaultPolicy,
      externalProviderIds: [],
      secondFactors: [],
    });
    await set.handle(
      SetLoginPolicyInput.create({
        ...RULES,
        forceMfa: true,
        secondFactors: [IdpSecondFactor.U2f],
      }),
      adminCtx(),
    );
    expect(await show.handle(none, adminCtx())).toMatchObject({
      forceMfa: true,
      secondFactors: [IdpSecondFactor.U2f],
    });
    expect(await show.handle(none, adminCtx(GLOBEX))).toMatchObject({ forceMfa: false });
  });
});
