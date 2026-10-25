/**
 * Stackra file contract:
 * Purpose: unit tests of `validateTheme`: each section is checked as a theme-section document, problems carry the
 *          section key in their path, and a theme of fitting blocks passes.
 * Boundary: test only; schemas registered by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import { validateTheme } from "#core/functions/validate-theme.function";
import type { BlockClass } from "#core/types/block-class.type";

class HeaderBlock extends Block({
  category: BlockCategory.Layout,
  icon: "panel-top",
  kinds: [ExperienceKind.ThemeSection],
}) {}
class HeroBlock extends Block({ category: BlockCategory.Marketing, icon: "sparkles" }) {}

registerSchemas([
  [HeaderBlock, z.object({})],
  [HeroBlock, z.object({})],
]);

const blocks = new Map<string, BlockClass>([
  ["theme.header", HeaderBlock],
  ["web.hero", HeroBlock],
]);

describe("validateTheme", () => {
  it("checks each section as a theme section, in key order", () => {
    expect(
      validateTheme(
        {
          sections: { header: { block: "theme.header" }, banner: { block: "web.hero" } },
          settings: {},
        },
        blocks,
      ),
    ).toEqual([{ path: "banner:0", code: "kind_not_allowed", block: "web.hero" }]);
    expect(
      validateTheme({ sections: { header: { block: "theme.header" } }, settings: {} }, blocks),
    ).toEqual([]);
  });
});
