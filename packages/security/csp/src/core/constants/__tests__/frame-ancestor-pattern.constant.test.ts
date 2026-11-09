/**
 * Stackra file contract:
 * Purpose: unit tests of `FRAME_ANCESTOR_PATTERN`: `self` and http(s) origins match; wildcards, paths, userinfo,
 *          quotes, separators and other schemes do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0334 rule 12.
 */
import { describe, expect, it } from "@stackra/testing";

import { FRAME_ANCESTOR_PATTERN } from "#core/constants/frame-ancestor-pattern.constant";

describe("FRAME_ANCESTOR_PATTERN", () => {
  it.each([
    ["self"],
    ["https://shop.example"],
    ["https://shop.example:8443"],
    ["http://localhost:3000"],
  ])("matches %j", (source) => {
    expect(FRAME_ANCESTOR_PATTERN.test(source)).toBe(true);
  });

  it.each([
    ["*"],
    ["'self'"],
    ["https://*.shop.example"],
    ["https://shop.example/"],
    ["https://u@shop.example"],
    ["wss://shop.example"],
    ["shop.example"],
    ["https://a.example b"],
    [""],
  ])("refuses %j", (source) => {
    expect(FRAME_ANCESTOR_PATTERN.test(source)).toBe(false);
  });
});
