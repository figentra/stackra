/**
 * Stackra file contract:
 * Purpose: unit tests of `registeredBlocks`: it lists every registered key (a renamed block's old key too) with its
 *          block class, and it is a copy, so changing it leaves the registry alone.
 * Boundary: test only; clears the internal `BLOCK_ENTRIES` after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 3); ADR 0294 (decision 22).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { Renamed } from "@stackra/validation";

import { Block } from "#core/bases/block.base";
import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import { registerBlocks } from "#core/functions/register-blocks.function";
import { registeredBlocks } from "#core/functions/registered-blocks.function";

@Renamed("web.hero")
class HeroSectionBlock extends Block({ category: BlockCategory.Marketing, icon: "sparkles" }) {}

class CtaBannerBlock extends Block({ category: BlockCategory.Marketing, icon: "megaphone" }) {}

/** A stand-in component; the registry never calls it. */
const Component = () => null;

afterEach(() => {
  BLOCK_ENTRIES.clear();
});

describe("registeredBlocks", () => {
  it("is empty before any registration", () => {
    expect(registeredBlocks().size).toBe(0);
  });

  it("lists every key with its block class, a renamed block's old key too", () => {
    registerBlocks([
      { key: "web.hero_section", block: HeroSectionBlock, component: Component },
      { key: "web.cta_banner", block: CtaBannerBlock, component: Component },
    ]);
    expect([...registeredBlocks()]).toEqual([
      ["web.hero_section", HeroSectionBlock],
      ["web.hero", HeroSectionBlock],
      ["web.cta_banner", CtaBannerBlock],
    ]);
  });

  it("is a copy the caller cannot change the registry through", () => {
    registerBlocks([{ key: "web.cta_banner", block: CtaBannerBlock, component: Component }]);
    const blocks = registeredBlocks() as Map<string, unknown>;
    blocks.delete("web.cta_banner");
    expect(registeredBlocks().get("web.cta_banner")).toBe(CtaBannerBlock);
    expect(BLOCK_ENTRIES.size).toBe(1);
  });
});
