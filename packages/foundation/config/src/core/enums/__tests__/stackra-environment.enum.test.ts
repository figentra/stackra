/**
 * Stackra file contract:
 * Purpose: unit tests of `StackraEnvironment`: the closed list holds exactly the five environments, in order from a
 *          developer's machine to customers (STA-2844).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-2844.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { StackraEnvironment } from "#core/enums/stackra-environment.enum";

describe("StackraEnvironment", () => {
  it("is the closed list of five", () => {
    expect(Enum.values(StackraEnvironment)).toEqual([
      "dev",
      "test",
      "preview",
      "staging",
      "production",
    ]);
  });
});
