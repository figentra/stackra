/**
 * Stackra file contract:
 * Purpose: unit tests of `assuranceOf`, `requireAssurance`, `stepUpSignIn` and `signInParams`: the strongest method
 *          wins and unknown methods reach nothing; a step-up passes only at the level and inside the window; the
 *          step-up options force a fresh authentication; the options become OpenID Connect parameters.
 * Boundary: test only; the defaults of `IdentityConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0207 (decision 1); RFC 8176.
 */
import { buildConfig } from "@stackra/config";
import { AssuranceLevel } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { StepUpRequiredError } from "#core/errors/step-up-required.error";
import { assuranceOf } from "#core/functions/assurance-of.function";
import { requireAssurance } from "#core/functions/require-assurance.function";
import { signInParams } from "#core/functions/sign-in-params.function";
import { stepUpSignIn } from "#core/functions/step-up-sign-in.function";

const identity = buildConfig(IdentityConfig);
const NOW = new Date("2026-10-25T09:00:00Z");
const seconds = (date: Date): number => Math.floor(date.getTime() / 1000);

describe("assuranceOf", () => {
  it("takes the strongest method and the authentication time", () => {
    expect(assuranceOf({ amr: ["pwd", "otp", "nope"], auth_time: seconds(NOW) }, identity)).toEqual(
      {
        level: AssuranceLevel.Aal2,
        authenticatedAt: NOW,
      },
    );
    expect(assuranceOf({ amr: ["hwk", "pwd"] }, identity).level).toBe(AssuranceLevel.Aal3);
    expect(assuranceOf({}, identity)).toEqual({ level: undefined, authenticatedAt: undefined });
  });
});

describe("requireAssurance", () => {
  const recent = new Date(NOW.getTime() - 5 * 60_000);
  const stale = new Date(NOW.getTime() - 11 * 60_000);

  it("passes at the level inside the window", () => {
    expect(() =>
      requireAssurance(
        { level: AssuranceLevel.Aal3, authenticatedAt: recent },
        AssuranceLevel.Aal2,
        identity,
        NOW,
      ),
    ).not.toThrow();
  });

  it("refuses a weaker, unknown or stale authentication", () => {
    for (const assurance of [
      { level: AssuranceLevel.Aal1, authenticatedAt: recent },
      { level: undefined, authenticatedAt: recent },
      { level: AssuranceLevel.Aal2, authenticatedAt: stale },
      { level: AssuranceLevel.Aal2, authenticatedAt: undefined },
    ]) {
      const refused = (() => {
        try {
          requireAssurance(assurance, AssuranceLevel.Aal2, identity, NOW);
          return undefined;
        } catch (error) {
          return error;
        }
      })();
      expect(refused).toBeInstanceOf(StepUpRequiredError);
      expect((refused as StepUpRequiredError).details).toEqual({ required: "aal2" });
    }
  });
});

describe("stepUpSignIn and signInParams", () => {
  it("forces a fresh authentication", () => {
    expect(stepUpSignIn()).toEqual({ forceLogin: true, maxAge: 0 });
    expect(signInParams(stepUpSignIn(["mfa"]))).toEqual({
      acr_values: "mfa",
      max_age: "0",
      prompt: "login",
    });
    expect(signInParams()).toEqual({});
    expect(() => signInParams({ maxAge: -1 })).toThrow(RangeError);
  });
});
