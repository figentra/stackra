/**
 * Stackra file contract:
 * Purpose: unit tests of `SAFETY_CRITICAL_VARIABLES` and `ENVIRONMENT_VARIABLE`: the running environment's variable
 *          is the first runtime-only name, the dev sign-in's key set (`STACKRA_DEV_ISSUER_KEYS`) the second, and the
 *          list cannot be changed at run time (STA-2844, STA-2795).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-2844; ADR 0206
 *                     (amendment 2026-11-26: dev keys are runtime-only); STA-2795.
 */
import { describe, expect, it } from "@stackra/testing";

import { ENVIRONMENT_VARIABLE } from "#core/constants/environment-variable.constant";
import { SAFETY_CRITICAL_VARIABLES } from "#core/constants/safety-critical-variables.constant";

describe("SAFETY_CRITICAL_VARIABLES", () => {
  it("holds STACKRA_ENVIRONMENT and the dev sign-in's key set, frozen", () => {
    expect(ENVIRONMENT_VARIABLE).toBe("STACKRA_ENVIRONMENT");
    expect(SAFETY_CRITICAL_VARIABLES).toEqual(["STACKRA_ENVIRONMENT", "STACKRA_DEV_ISSUER_KEYS"]);
    expect(Object.isFrozen(SAFETY_CRITICAL_VARIABLES)).toBe(true);
  });
});
