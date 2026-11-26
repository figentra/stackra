/**
 * Stackra file contract:
 * Purpose: unit tests of `FRAME_ANCESTOR_PATH_PATTERN`: exact paths and `/*` prefixes match; a `*` anywhere else, a
 *          relative path, whitespace, a query and a fragment do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0334 rule 12.
 */
import { describe, expect, it } from "@stackra/testing";

import { FRAME_ANCESTOR_PATH_PATTERN } from "#core/constants/frame-ancestor-path-pattern.constant";

describe("FRAME_ANCESTOR_PATH_PATTERN", () => {
  it.each([["/"], ["/preview"], ["/c/*"], ["/*"], ["/a/b/*"]])("matches %j", (path) => {
    expect(FRAME_ANCESTOR_PATH_PATTERN.test(path)).toBe(true);
  });

  it.each([["*"], ["c/*"], ["/c*"], ["/*/x"], ["/a b"], ["/a?b"], ["/a#b"], [""]])(
    "refuses %j",
    (path) => {
      expect(FRAME_ANCESTOR_PATH_PATTERN.test(path)).toBe(false);
    },
  );
});
