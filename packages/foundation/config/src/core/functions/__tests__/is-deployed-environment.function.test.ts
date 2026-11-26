/**
 * Stackra file contract:
 * Purpose: unit tests of `isDeployedEnvironment`: preview, staging and production are deployments; dev and test are
 *          not (STA-2844).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-2844.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { StackraEnvironment } from "#core/enums/stackra-environment.enum";
import { isDeployedEnvironment } from "#core/functions/is-deployed-environment.function";

describe("isDeployedEnvironment", () => {
  it("is true for every environment but dev and test", () => {
    expect(
      Enum.values(StackraEnvironment).filter((environment) => isDeployedEnvironment(environment)),
    ).toEqual(["preview", "staging", "production"]);
  });
});
