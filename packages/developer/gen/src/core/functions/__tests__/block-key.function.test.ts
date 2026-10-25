/**
 * Stackra file contract:
 * Purpose: unit tests of `blockKey`: `<member>.<snake(folder)>` from the block class's folder.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); ADR 0270 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { blockKey } from "#core/functions/block-key.function";

describe("blockKey", () => {
  it("joins the member and the snake-cased folder", () => {
    expect(blockKey("web", "src/blocks/cta-banner/cta-banner.block.ts")).toBe("web.cta_banner");
    expect(blockKey("store_front", "src/blocks/hero/hero.block.ts")).toBe("store_front.hero");
  });
});
