/**
 * Stackra file contract:
 * Purpose: unit tests of `wrapCaption`: lines break at spaces within the limit, and a word longer than the limit keeps
 *          its own line.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: D19).
 */
import { describe, expect, it } from "@stackra/testing";

import { wrapCaption } from "#core/functions/wrap-caption.function";

describe("wrapCaption", () => {
  it("breaks at spaces", () => {
    expect(wrapCaption("Every size and colour, one scan away", 20)).toEqual([
      "Every size and",
      "colour, one scan",
      "away",
    ]);
  });

  it("keeps a long word on its own line", () => {
    expect(wrapCaption("a extraordinarily b", 5)).toEqual(["a", "extraordinarily", "b"]);
  });
});
