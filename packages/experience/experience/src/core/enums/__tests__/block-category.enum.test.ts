/**
 * Stackra file contract:
 * Purpose: unit tests of `BlockCategory`: the five palette groups, in palette order, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 3); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BlockCategory } from "#core/enums/block-category.enum";

describe("BlockCategory", () => {
  it("lists the palette groups in order", () => {
    expect(Enum.values(BlockCategory)).toEqual([
      "layout",
      "content",
      "media",
      "marketing",
      "commerce",
    ]);
    expect(BlockCategory.Marketing).toBe("marketing");
  });
});
