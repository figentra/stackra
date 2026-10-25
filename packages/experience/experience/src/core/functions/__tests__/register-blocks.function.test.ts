/**
 * Stackra file contract:
 * Purpose: unit tests of `registerBlocks`: a block is registered under its key and, when renamed, under its old key
 *          too; a bad key, a class of another kind, a missing component or a key taken by another class throws and
 *          registers nothing of the batch; registering the same class again replaces its entry.
 * Boundary: test only; reads the internal `BLOCK_ENTRIES` and clears it after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 3); ADR 0294 (decisions 20 and 22).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { Renamed, Schema } from "@stackra/validation";

import { Block } from "#core/bases/block.base";
import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import { registerBlocks } from "#core/functions/register-blocks.function";
import type { BlockClass } from "#core/types/block-class.type";

@Renamed("web.hero")
class HeroSectionBlock extends Block({ category: BlockCategory.Marketing, icon: "sparkles" }) {}

class CtaBannerBlock extends Block({ category: BlockCategory.Marketing, icon: "megaphone" }) {}

/** A stand-in component; the registry never calls it. */
const Component = () => null;

/** A second stand-in, for a replaced entry. */
const NextComponent = () => null;

afterEach(() => {
  BLOCK_ENTRIES.clear();
});

describe("registerBlocks", () => {
  it("registers a block under its key and a renamed block under its old key too", () => {
    const hero = { key: "web.hero_section", block: HeroSectionBlock, component: Component };
    registerBlocks([hero, { key: "web.cta_banner", block: CtaBannerBlock, component: Component }]);
    expect(BLOCK_ENTRIES.get("web.hero_section")).toBe(hero);
    expect(BLOCK_ENTRIES.get("web.hero")).toBe(hero);
    expect(BLOCK_ENTRIES.get("web.cta_banner")?.block).toBe(CtaBannerBlock);
  });

  it("replaces the entry of a class registered again", () => {
    registerBlocks([{ key: "web.cta_banner", block: CtaBannerBlock, component: Component }]);
    registerBlocks([{ key: "web.cta_banner", block: CtaBannerBlock, component: NextComponent }]);
    expect(BLOCK_ENTRIES.get("web.cta_banner")?.component).toBe(NextComponent);
  });

  it("refuses the whole batch on a bad entry", () => {
    const good = { key: "web.cta_banner", block: CtaBannerBlock, component: Component };
    expect(() => registerBlocks([good, { ...good, key: "Web.Hero" }])).toThrow(RangeError);
    expect(() =>
      registerBlocks([good, { ...good, key: "web.shape", block: Schema as unknown as BlockClass }]),
    ).toThrow(/does not extend Block/);
    expect(() => registerBlocks([good, { ...good, key: "web.empty", component: null }])).toThrow(
      /no component/,
    );
    expect(BLOCK_ENTRIES.size).toBe(0);
  });

  it("refuses a key that is another class's", () => {
    registerBlocks([{ key: "web.cta_banner", block: CtaBannerBlock, component: Component }]);
    expect(() =>
      registerBlocks([{ key: "web.cta_banner", block: HeroSectionBlock, component: Component }]),
    ).toThrow(/already CtaBannerBlock's/);
    expect(() =>
      registerBlocks([{ key: "web.hero", block: CtaBannerBlock, component: Component }]),
    ).not.toThrow();
    expect(() =>
      registerBlocks([{ key: "web.hero_section", block: HeroSectionBlock, component: Component }]),
    ).toThrow(/"web.hero" is already CtaBannerBlock's/);
  });
});
