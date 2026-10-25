/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: it exports `refusal` and `toRefuseWith` and nothing else,
 *          and importing it registers `toRefuseWith` with `expect`.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { ForbiddenError } from "#core/index";
import * as testing from "#testing/index";

describe("@stackra/errors/testing", () => {
  it("exports exactly refusal and toRefuseWith", () => {
    expect(Object.keys(testing).sort()).toEqual(["refusal", "toRefuseWith"]);
  });

  it("registers toRefuseWith on import", () => {
    expect(ForbiddenError.create()).toRefuseWith(testing.refusal(ForbiddenError));
  });
});
