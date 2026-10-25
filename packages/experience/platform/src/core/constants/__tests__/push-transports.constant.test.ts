/**
 * Stackra file contract:
 * Purpose: unit tests of `PUSH_TRANSPORTS`: the four driver names, each the prefix of a driver file of this package.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { PUSH_TRANSPORTS } from "#core/constants/push-transports.constant";

describe("PUSH_TRANSPORTS", () => {
  it("names the memory, web, expo and self-hosted drivers", () => {
    expect(PUSH_TRANSPORTS).toEqual(["memory", "web", "expo", "self_hosted"]);
  });
});
