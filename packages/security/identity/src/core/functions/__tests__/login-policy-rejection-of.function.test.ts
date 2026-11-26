/**
 * Stackra file contract:
 * Purpose: unit tests of `loginPolicyRejectionOf`: a sound policy passes; a provider the deployment does not configure
 *          is refused, while one linked outside the call and left out of the request is not; a policy with no way left
 *          to sign in is refused (an allowed external provider counts only when the organisation offers one); a forced
 *          second factor with none offered is refused, the organisation's current factors counting when the request
 *          leaves the list out.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0207 (decision 1); ADR 0410 (decision 4); STA-2817.
 */
import { describe, expect, it } from "@stackra/testing";

import { IdpSecondFactor, LoginPolicyRejection } from "#contracts/index";
import type { LoginPolicy } from "#contracts/index";
import { loginPolicyRejectionOf } from "#core/functions/login-policy-rejection-of.function";

/** Passwords only, nothing forced, no list. */
const RULES: LoginPolicy = {
  allowUsernamePassword: true,
  allowRegister: false,
  allowExternalIdp: false,
  forceMfa: false,
  allowPasswordless: false,
  hidePasswordReset: false,
  ignoreUnknownUsernames: true,
};

/** What the organisation offers now. */
const CURRENT: LoginPolicy = { ...RULES, externalProviderIds: [], secondFactors: [] };

const KNOWN = ["idp_nafath", "idp_apple"];

describe(loginPolicyRejectionOf, () => {
  it("passes a policy that leaves a way in and offers what it forces", () => {
    expect(loginPolicyRejectionOf(RULES, CURRENT, KNOWN)).toBeUndefined();
    expect(
      loginPolicyRejectionOf(
        { ...RULES, forceMfa: true, secondFactors: [IdpSecondFactor.Totp] },
        CURRENT,
        KNOWN,
      ),
    ).toBeUndefined();
  });

  it("refuses a provider the deployment does not configure, but not one only linked before", () => {
    expect(
      loginPolicyRejectionOf(
        { ...RULES, externalProviderIds: ["idp_nafath", "idp_rogue"] },
        CURRENT,
        KNOWN,
      ),
    ).toBe(LoginPolicyRejection.UnknownProvider);
    expect(
      loginPolicyRejectionOf(RULES, { ...CURRENT, externalProviderIds: ["idp_legacy"] }, KNOWN),
    ).toBeUndefined();
  });

  it("refuses a policy that leaves no way to sign in", () => {
    const closed = { ...RULES, allowUsernamePassword: false };
    expect(loginPolicyRejectionOf(closed, CURRENT, KNOWN)).toBe(
      LoginPolicyRejection.NoSignInMethod,
    );
    expect(loginPolicyRejectionOf({ ...closed, allowExternalIdp: true }, CURRENT, KNOWN)).toBe(
      LoginPolicyRejection.NoSignInMethod,
    );
    expect(
      loginPolicyRejectionOf(
        { ...closed, allowExternalIdp: true, externalProviderIds: ["idp_nafath"] },
        CURRENT,
        KNOWN,
      ),
    ).toBeUndefined();
    expect(
      loginPolicyRejectionOf(
        { ...closed, allowExternalIdp: true },
        { ...CURRENT, externalProviderIds: ["idp_nafath"] },
        KNOWN,
      ),
    ).toBeUndefined();
    expect(
      loginPolicyRejectionOf({ ...closed, allowPasswordless: true }, CURRENT, KNOWN),
    ).toBeUndefined();
  });

  it("refuses a forced second factor with none offered, counting the current ones when left out", () => {
    const forced = { ...RULES, forceMfa: true };
    expect(loginPolicyRejectionOf(forced, CURRENT, KNOWN)).toBe(
      LoginPolicyRejection.NoSecondFactor,
    );
    expect(
      loginPolicyRejectionOf(
        { ...forced, secondFactors: [] },
        { ...CURRENT, secondFactors: [IdpSecondFactor.U2f] },
        KNOWN,
      ),
    ).toBe(LoginPolicyRejection.NoSecondFactor);
    expect(
      loginPolicyRejectionOf(forced, { ...CURRENT, secondFactors: [IdpSecondFactor.U2f] }, KNOWN),
    ).toBeUndefined();
    expect(loginPolicyRejectionOf(forced, RULES, KNOWN)).toBe(LoginPolicyRejection.NoSecondFactor);
  });
});
