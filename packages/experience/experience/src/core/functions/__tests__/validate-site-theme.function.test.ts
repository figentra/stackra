/**
 * Stackra file contract:
 * Purpose: unit tests of `validateSiteTheme`: each section is checked as a theme-section document, problems carry the
 *          section key in their path, and a theme of fitting blocks passes.
 * Boundary: test only; schemas registered by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decision 6); STA-1383 (renamed SiteTheme so Theme means design tokens).
 */
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import { validateSiteTheme } from "#core/functions/validate-site-theme.function";
import type { BlockClass } from "#core/types/block-class.type";

class HeaderBlock extends Block({
  category: BlockCategory.Layout,
  icon: "panel-top",
  kinds: [ExperienceKind.ThemeSection],
}) {}
class HeroBlock extends Block({
  category: BlockCategory.Marketing,
  icon: "sparkles",
}) {}

registerSchemas([
  [HeaderBlock, z.object({})],
  [HeroBlock, z.object({})],
]);

const blocks = new Map<string, BlockClass>([
  ["theme.header", HeaderBlock],
  ["web.hero", HeroBlock],
]);

describe("validateSiteTheme", () => {
  it("checks each section as a theme section, in key order", () => {
    expect(
      validateSiteTheme(
        {
          sections: { header: { block: "theme.header" }, banner: { block: "web.hero" } },
          settings: {},
        },
        blocks,
      ),
    ).toEqual([{ path: "banner:0", code: "kind_not_allowed", block: "web.hero" }]);
    expect(
      validateSiteTheme({ sections: { header: { block: "theme.header" } }, settings: {} }, blocks),
    ).toEqual([]);
  });
});
