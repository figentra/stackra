/**
 * Stackra file contract:
 * Purpose: unit test of `REALTIME_PATH`: one absolute, unversioned, kebab-case path shared by the client and the
 *          generated endpoint.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; HTTP conventions (paths are unversioned and kebab-case).
 */
import { describe, expect, it } from "@stackra/testing";

import { REALTIME_PATH } from "#core/constants/realtime-path.constant";

describe("REALTIME_PATH", () => {
  it("is the one realtime endpoint path", () => {
    expect(REALTIME_PATH).toBe("/realtime");
    expect(REALTIME_PATH).toMatch(/^\/[a-z-]+$/);
  });
});
