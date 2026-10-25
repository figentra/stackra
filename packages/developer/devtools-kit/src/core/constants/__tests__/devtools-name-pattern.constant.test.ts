/**
 * Stackra file contract:
 * Purpose: unit test of `DEVTOOLS_NAME_PATTERN`: dotted lowercase segments pass; empty, uppercase, spaced,
 *          leading-digit and empty-segment names fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231.
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVTOOLS_NAME_PATTERN } from "#core/constants/devtools-name-pattern.constant";

describe("DEVTOOLS_NAME_PATTERN", () => {
  it.each(["bus", "router.tree", "cache.hit_rate", "container.module-graph"])(
    "accepts %s",
    (name) => {
      expect(DEVTOOLS_NAME_PATTERN.test(name)).toBe(true);
    },
  );

  it.each(["", "Router.tree", "router tree", "1router", "router..tree", "router.", ".tree"])(
    "refuses %j",
    (name) => {
      expect(DEVTOOLS_NAME_PATTERN.test(name)).toBe(false);
    },
  );
});
