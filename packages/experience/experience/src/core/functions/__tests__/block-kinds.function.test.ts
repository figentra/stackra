/**
 * Stackra file contract:
 * Purpose: unit tests of `blockKinds`: a block's declared kinds, the page-and-screen default, and none for a class that
 *          is not a block.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import { blockKinds } from "#core/functions/block-kinds.function";

describe("blockKinds", () => {
  it("reads the declared kinds and the default", () => {
    class SlipBlock extends Block({
      category: BlockCategory.Commerce,
      icon: "receipt",
      kinds: [ExperienceKind.PrintDocument],
    }) {}
    class HeroBlock extends Block({ category: BlockCategory.Marketing, icon: "sparkles" }) {}
    expect(blockKinds(SlipBlock)).toEqual(["print_document"]);
    expect(blockKinds(HeroBlock)).toEqual(["page", "screen"]);
  });

  it("gives none for a class that is not a block", () => {
    expect(blockKinds(class Plain {})).toEqual([]);
  });
});
