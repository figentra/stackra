/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Block` kind base: the template's blocks record their category, icon and
 *          accepted query, a bad category, an empty icon or a non-query `accepts` is refused where it is declared,
 *          field decorators and `@Renamed` may mark a block, its brand never counts as a prop, and the kind is called
 *          only.
 * Boundary: test only; the classes restate the template's web `hero-section` and `testimonials` blocks with a local
 *           query ref.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16, 22 and 25); ADR 0305 (rules 2 and 43).
 */
import { queryRef } from "@stackra/clients";
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Int, Renamed } from "@stackra/validation";
import type { Fields } from "@stackra/validation";
import { z } from "zod";

import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { BlockClass } from "#core/types/block-class.type";
import type { BlockOptions } from "#core/types/block-options.type";
import type { LocalizedText } from "#core/types/localized-text.type";

/** A stand-in for the content service's `content.entry.list` client. */
class ListEntriesQuery extends queryRef("content.entry.list@1", {
  input: z.object({ type: z.string() }),
  output: z.object({ entries: z.array(z.object({ id: z.string() })) }),
}) {}

@Renamed("web.hero")
class HeroSectionBlock extends Block({ category: BlockCategory.Marketing, icon: "sparkles" }) {
  title!: LocalizedText;

  subtitle?: LocalizedText;
}

class TestimonialsBlock extends Block({
  category: BlockCategory.Content,
  icon: "quote",
  accepts: ListEntriesQuery,
}) {
  title!: LocalizedText;

  @Int({ min: 1, max: 12 })
  limit = 3;
}

/** A declaration with `options`, run later. */
const bad = (options: object) => () => Block(options as BlockOptions);

describe("Block", () => {
  it("records the category and the icon, with no query", () => {
    expect(kindOf(HeroSectionBlock)).toEqual({
      kind: "block",
      options: { category: "marketing", icon: "sparkles", accepts: null },
    });
  });

  it("records the accepted query class", () => {
    expect(kindOf(TestimonialsBlock)?.options["accepts"]).toBe(ListEntriesQuery);
  });

  it("keeps @Renamed's old key on the block", () => {
    expect(Renamed.on(HeroSectionBlock)).toBe("web.hero");
  });

  it("refuses a bad category, an empty icon or a non-query accepts where it is declared", () => {
    expect(bad({ category: "hero", icon: "house" })).toThrow(RangeError);
    expect(bad({ category: BlockCategory.Content, icon: "" })).toThrow(/icon/);
    expect(
      bad({ category: BlockCategory.Content, icon: "house", accepts: () => undefined }),
    ).toThrow(TypeError);
  });

  it("keeps instanceof, field initialisers and a class per call", () => {
    const block = new TestimonialsBlock();
    expect(block).toBeInstanceOf(Block);
    expect(block.limit).toBe(3);
    expect(Object.getPrototypeOf(HeroSectionBlock)).not.toBe(
      Object.getPrototypeOf(TestimonialsBlock),
    );
    expect((Block as unknown as { name: string }).name).toBe("Block");
  });

  it("is called only, carries the accepted query's type and adds no prop", () => {
    expectTypeOf(Block({ category: BlockCategory.Media, icon: "image" })).toEqualTypeOf<
      BlockClass<undefined>
    >();
    expectTypeOf<(typeof TestimonialsBlock)["~accepts"]>().toEqualTypeOf<
      typeof ListEntriesQuery | undefined
    >();
    expectTypeOf<keyof Fields<HeroSectionBlock>>().toEqualTypeOf<"title" | "subtitle">();
  });
});
