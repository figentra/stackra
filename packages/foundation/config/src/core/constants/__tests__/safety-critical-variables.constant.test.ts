/**
 * Stackra file contract:
 * Purpose: unit tests of `SAFETY_CRITICAL_VARIABLES` and `ENVIRONMENT_VARIABLE`: the running environment's variable
 *          is the first runtime-only name, and the list cannot be changed at run time (STA-2844).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-2844.
 */
import { describe, expect, it } from "@stackra/testing";

import { ENVIRONMENT_VARIABLE } from "#core/constants/environment-variable.constant";
import { SAFETY_CRITICAL_VARIABLES } from "#core/constants/safety-critical-variables.constant";

describe("SAFETY_CRITICAL_VARIABLES", () => {
  it("holds STACKRA_ENVIRONMENT, frozen", () => {
    expect(ENVIRONMENT_VARIABLE).toBe("STACKRA_ENVIRONMENT");
    expect(SAFETY_CRITICAL_VARIABLES).toEqual(["STACKRA_ENVIRONMENT"]);
    expect(Object.isFrozen(SAFETY_CRITICAL_VARIABLES)).toBe(true);
  });
});
