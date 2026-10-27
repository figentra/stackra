/**
 * Stackra file contract:
 * Purpose: unit tests of `@stackra/shipping/testing`: the entry exports exactly the fake.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/shipping/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["CarrierGatewaysFake"]);
  });
});
