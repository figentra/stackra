/**
 * Stackra file contract:
 * Purpose: proves each of the fifteen landing blocks registers the `block` kind in the marketing palette with its
 *          icon, accepts no query, fits a page and a screen, and declares exactly its document props, nested shapes as
 *          Schema classes and numbers as decorated fields.
 * Boundary: test only; reads the kind registry through `kindOf` and the props through `Fields`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 26); ADR 0305 (rule 2); STA-2041.
 */
import { kindOf } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { Fields } from "@stackra/validation";

import { Block } from "#core/bases/block.base";
import { AskAiBlock } from "#core/blocks/ask-ai/ask-ai.block";
import { BentoGridBlock } from "#core/blocks/bento-grid/bento-grid.block";
import { ChapterTitleBlock } from "#core/blocks/chapter-title/chapter-title.block";
import { CtaRowBlock } from "#core/blocks/cta-row/cta-row.block";
import { HeroMachineBlock } from "#core/blocks/hero-machine/hero-machine.block";
import { MonoDisplayBlock } from "#core/blocks/mono-display/mono-display.block";
import { PageDockBlock } from "#core/blocks/page-dock/page-dock.block";
import { ProductCardsBlock } from "#core/blocks/product-cards/product-cards.block";
import { SiteFooterBlock } from "#core/blocks/site-footer/site-footer.block";
import { SiteHeaderBlock } from "#core/blocks/site-header/site-header.block";
import { StatementBlock } from "#core/blocks/statement/statement.block";
import { StationBlock } from "#core/blocks/station/station.block";
import { StepSwitcherBlock } from "#core/blocks/step-switcher/step-switcher.block";
import { SurfacesBlock } from "#core/blocks/surfaces/surfaces.block";
import { TerminalStageBlock } from "#core/blocks/terminal-stage/terminal-stage.block";
import { MonoDisplayArt } from "#core/enums/mono-display-art.enum";
import { ProductCardsLayout } from "#core/enums/product-cards-layout.enum";
import { SurfaceKind } from "#core/enums/surface-kind.enum";
import { TerminalLineKind } from "#core/enums/terminal-line-kind.enum";
import type { DitherBand } from "#core/schemas/dither-band.schema";
import type { Drawing } from "#core/schemas/drawing.schema";
import type { Machine } from "#core/schemas/machine.schema";
import type { Surface } from "#core/schemas/surface.schema";

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
  [TerminalStageBlock, "terminal"],
  [MonoDisplayBlock, "type"],
  [AskAiBlock, "bot"],
  [ProductCardsBlock, "boxes"],
  [SiteFooterBlock, "panel-bottom"],
  [SurfacesBlock, "monitor-smartphone"],
  [PageDockBlock, "panel-bottom-open"],
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
    expect(new Set(BLOCKS.map(([declared]) => declared)).size).toBe(15);
  });

  it("gives the closed choices as enums with the components' codes", () => {
    expect(Enum.values(SurfaceKind)).toEqual(["web", "desktop", "phone"]);
    expect(Enum.values(TerminalLineKind)).toEqual([
      "command",
      "output",
      "prompt",
      "choice",
      "success",
    ]);
    expect(Enum.values(MonoDisplayArt)).toEqual(["floors", "glyphs", "none"]);
    expect(Enum.values(ProductCardsLayout)).toEqual(["grid", "strip"]);
  });

  it("declares exactly the document props", () => {
    expectTypeOf<keyof Fields<HeroMachineBlock>>().toEqualTypeOf<
      "title" | "lede" | "primary" | "copyLink" | "command" | "art" | "horizon" | "machine"
    >();
    expectTypeOf<keyof Fields<StationBlock>>().toEqualTypeOf<"id" | "title" | "body" | "status">();
    expectTypeOf<keyof Fields<StepSwitcherBlock>>().toEqualTypeOf<"label" | "steps">();
    expectTypeOf<keyof Fields<SiteFooterBlock>>().toEqualTypeOf<"groups" | "legal">();
    expectTypeOf<keyof Fields<TerminalStageBlock>>().toEqualTypeOf<
      "command" | "lines" | "label" | "art" | "monitor"
    >();
    expectTypeOf<keyof Fields<AskAiBlock>>().toEqualTypeOf<
      "label" | "docsUrl" | "placeholder" | "isComingSoon" | "comingSoonNote"
    >();
    expectTypeOf<keyof Fields<ProductCardsBlock>>().toEqualTypeOf<
      "label" | "linkLabel" | "products" | "layout"
    >();
    expectTypeOf<keyof Fields<SurfacesBlock>>().toEqualTypeOf<"label" | "surfaces">();
    expectTypeOf<keyof Fields<PageDockBlock>>().toEqualTypeOf<"label" | "items">();
    expectTypeOf<HeroMachineBlock["art"]>().toEqualTypeOf<Drawing>();
    expectTypeOf<HeroMachineBlock["horizon"]>().toEqualTypeOf<DitherBand>();
    expectTypeOf<HeroMachineBlock["machine"]>().toEqualTypeOf<Machine | undefined>();
    expectTypeOf<SurfacesBlock["surfaces"]>().toEqualTypeOf<Surface[]>();
    expectTypeOf<Surface["kind"]>().toEqualTypeOf<SurfaceKind>();
  });
});
