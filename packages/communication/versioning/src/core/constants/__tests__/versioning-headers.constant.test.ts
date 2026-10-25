/**
 * Stackra file contract:
 * Purpose: unit tests of `VERSIONING_HEADERS`: the three header names, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decisions 3 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";

describe("VERSIONING_HEADERS", () => {
  it("names the request and response headers, frozen", () => {
    expect(VERSIONING_HEADERS).toEqual({
      version: "Stackra-Version",
      deprecation: "Deprecation",
      sunset: "Sunset",
    });
    expect(Object.isFrozen(VERSIONING_HEADERS)).toBe(true);
  });
});
