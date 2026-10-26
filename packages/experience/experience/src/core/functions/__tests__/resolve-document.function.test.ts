/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveDocument`, the document validator: a node or a list resolves to its registered
 *          entries with parsed, localised props, the accepted query and its input, and resolved children; a renamed key
 *          still resolves; `null` is empty; a malformed node, an unknown key and refused props each throw their
 *          refusal with the node's path, and nothing resolves.
 * Boundary: test only; the blocks' schemas are registered by hand in the form gen compiles them, and the internal
 *           `BLOCK_ENTRIES` is cleared after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decisions 1, 2 and 6); ADR 0294 (decision 26).
 */
import { queryRef } from "@stackra/clients";
import { isRefusal } from "@stackra/errors";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas, Renamed } from "@stackra/validation";
import { z } from "zod";

import { Block } from "#core/bases/block.base";
import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import { InvalidDocumentError } from "#core/errors/invalid-document.error";
import { UnknownBlockError } from "#core/errors/unknown-block.error";
import { registerBlocks } from "#core/functions/register-blocks.function";
import { resolveDocument } from "#core/functions/resolve-document.function";
import type { LocalizedText } from "#core/types/localized-text.type";

/** A stand-in for the content service's `content.entry.list` client. */
class ListEntriesQuery extends queryRef("content.entry.list@1", {
  input: z.object({ type: z.string() }),
  output: z.object({ entries: z.array(z.object({ id: z.string() })) }),
}) {}

@Renamed("web.hero")
class HeroSectionBlock extends Block({
  category: BlockCategory.Marketing,
  icon: "sparkles",
}) {
  title!: LocalizedText;
}

class TestimonialsBlock extends Block({
  category: BlockCategory.Content,
  icon: "quote",
  accepts: ListEntriesQuery,
}) {
  limit = 3;
}

class SectionBlock extends Block({
  category: BlockCategory.Layout,
  icon: "layout-grid",
}) {}

registerSchemas([
  [HeroSectionBlock, z.object({ title: z.record(z.string(), z.string()) })],
  [TestimonialsBlock, z.object({ limit: z.number().int().min(1).max(12).default(3) })],
  [SectionBlock, z.object({})],
]);

/** The component each block draws with; the validator never calls it. */
const Component = () => null;

beforeEach(() => {
  registerBlocks([
    { key: "web.hero_section", block: HeroSectionBlock, component: Component },
    { key: "web.testimonials", block: TestimonialsBlock, component: Component },
    { key: "web.section", block: SectionBlock, component: Component },
  ]);
});

afterEach(() => {
  BLOCK_ENTRIES.clear();
});

/** What `run` throws; `undefined` when it throws nothing, which fails the refusal checks. */
function refusalOf(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("resolveDocument", () => {
  it("resolves a tree with localised props, the accepted query and resolved children", () => {
    const [section] = resolveDocument(
      {
        block: "web.section",
        children: [
          { block: "web.hero", props: { title: { en: "Sell online", ar: "بع عبر الإنترنت" } } },
          { block: "web.testimonials", input: { type: "testimonial" } },
        ],
      },
      "ar-SA",
    );
    expect(section?.path).toBe("0");
    expect(section?.accepts).toBeNull();
    const [hero, testimonials] = section?.children ?? [];
    expect(hero?.entry.block).toBe(HeroSectionBlock);
    expect(hero?.props).toEqual({ title: "بع عبر الإنترنت" });
    expect(hero?.input).toEqual({});
    expect(testimonials?.path).toBe("0.children.1");
    expect(testimonials?.props).toEqual({ limit: 3 });
    expect(testimonials?.accepts).toBe(ListEntriesQuery);
    expect(testimonials?.input).toEqual({ type: "testimonial" });
  });

  it("resolves a list, and null or undefined as nothing", () => {
    expect(
      resolveDocument([{ block: "web.section" }, { block: "web.section" }], "en"),
    ).toHaveLength(2);
    expect(resolveDocument(null, "en")).toEqual([]);
    expect(resolveDocument(undefined, "en")).toEqual([]);
  });

  it("refuses a malformed node with its path", () => {
    for (const document of ["text", { props: {} }, { block: "web.section", children: {} }]) {
      const refused = refusalOf(() => resolveDocument(document, "en"));
      expect(isRefusal(refused, InvalidDocumentError)).toBe(true);
    }
    const nested = refusalOf(() =>
      resolveDocument(
        { block: "web.section", children: [{ block: "web.section", props: [] }] },
        "en",
      ),
    );
    expect((nested as InvalidDocumentError).details).toEqual({
      path: "0.children.0",
      block: "web.section",
    });
  });

  it("refuses a key nobody registered", () => {
    const refused = refusalOf(() =>
      resolveDocument([{ block: "web.section" }, { block: "web.gone" }], "en"),
    );
    expect(isRefusal(refused, UnknownBlockError)).toBe(true);
    expect((refused as UnknownBlockError).details).toEqual({ block: "web.gone", path: "1" });
  });

  it("refuses props the block's schema refuses, with the issues as the cause", () => {
    const refused = refusalOf(() =>
      resolveDocument({ block: "web.testimonials", props: { limit: 40 } }, "en"),
    );
    expect(isRefusal(refused, InvalidDocumentError)).toBe(true);
    expect((refused as InvalidDocumentError).details).toEqual({
      path: "0",
      block: "web.testimonials",
    });
    expect((refused as InvalidDocumentError).cause).toBeInstanceOf(z.ZodError);
  });
});
