/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: `actors`, which the template's tests import, and the
 *          testing-module plugin are its only exports.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/iam/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["IAM_TESTING_PLUGIN", "actors"]);
  });
});
