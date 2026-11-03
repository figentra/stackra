/**
 * Stackra file contract:
 * Purpose: proves each of the thirteen landing blocks registers the `block` kind in the marketing palette with its
 *          icon, accepts no query, fits a page and a screen, and declares exactly its document props.
 * Boundary: test only; reads the kind registry through `kindOf` and the props through `Fields`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); ADR 0305 (rule 2); STA-2041.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { Fields } from "@stackra/validation";

import { Block } from "#core/bases/block.base";
import { AskAiBlock } from "#core/blocks/ask-ai.block";
import { BentoGridBlock } from "#core/blocks/bento-grid.block";
import { ChapterTitleBlock } from "#core/blocks/chapter-title.block";
import { CtaRowBlock } from "#core/blocks/cta-row.block";
import { HeroMachineBlock } from "#core/blocks/hero-machine.block";
import { MonoDisplayBlock } from "#core/blocks/mono-display.block";
import { ProductCardsBlock } from "#core/blocks/product-cards.block";
import { SiteFooterBlock } from "#core/blocks/site-footer.block";
import { SiteHeaderBlock } from "#core/blocks/site-header.block";
import { StatementBlock } from "#core/blocks/statement.block";
import { StationBlock } from "#core/blocks/station.block";
import { StepSwitcherBlock } from "#core/blocks/step-switcher.block";
import { TerminalDemoBlock } from "#core/blocks/terminal-demo.block";

/** Each landing block and the palette icon it declares. */
const BLOCKS = [
  [SiteHeaderBlock, "panel-top"],
  [HeroMachineBlock, "sparkles"],
  [CtaRowBlock, "mouse-pointer-click"],
  [StatementBlock, "quote"],
  [ChapterTitleBlock, "heading"],
  [StationBlock, "milestone"],
  [StepSwitcherBlock, "list-ordered"],
  [BentoGridBlock, "layout-grid"],
  [TerminalDemoBlock, "terminal"],
  [MonoDisplayBlock, "type"],
  [AskAiBlock, "bot"],
  [ProductCardsBlock, "boxes"],
  [SiteFooterBlock, "panel-bottom"],
] as const;

describe("the landing blocks", () => {
  for (const [Declared, icon] of BLOCKS)
    it(`${Declared.name} registers a marketing block with its icon`, () => {
      expect(kindOf(Declared)).toEqual({
        kind: "block",
        options: { category: "marketing", icon, accepts: null, kinds: ["page", "screen"] },
      });
      expect(new Declared()).toBeInstanceOf(Block);
    });

  it("declares a class per block", () => {
    expect(new Set(BLOCKS.map(([declared]) => declared)).size).toBe(13);
  });

  it("declares exactly the document props", () => {
    expectTypeOf<keyof Fields<HeroMachineBlock>>().toEqualTypeOf<
      "title" | "lede" | "primary" | "copyLink" | "command" | "art" | "horizon"
    >();
    expectTypeOf<keyof Fields<StationBlock>>().toEqualTypeOf<"id" | "title" | "body" | "status">();
    expectTypeOf<keyof Fields<StepSwitcherBlock>>().toEqualTypeOf<"label" | "steps">();
    expectTypeOf<keyof Fields<SiteFooterBlock>>().toEqualTypeOf<"groups" | "legal">();
  });
});
