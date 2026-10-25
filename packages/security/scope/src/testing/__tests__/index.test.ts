/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: it exports exactly `fakeScopeTree` and `scopeRefOf`.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0269 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/scope/testing", () => {
  it("exports exactly its helpers", () => {
    expect(Object.keys(testing).sort()).toEqual(["fakeScopeTree", "scopeRefOf"]);
  });
});
