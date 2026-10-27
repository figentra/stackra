/**
 * Stackra file contract:
 * Purpose: unit tests of `renderEdgeDocument`: OS edge blocks render to HTML with localised, escaped props and their
 *          children; a renamed key still renders; an unknown (product) block and a query-backed block become
 *          placeholders carrying the stored node; and a malformed document, refused props, a throwing block and each
 *          budget overrun return `ok: false` with the reason, the path and the revision instead of throwing.
 * Boundary: test only; the blocks' schemas are registered by hand in the form gen compiles them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0440; app-shells-edge-and-extension.md section 16 (points 1 and 6).
 */
import { queryRef } from "@stackra/clients";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Renamed } from "@stackra/validation";
import { z } from "zod";
import { escapeHtml } from "@stackra/support";

import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { LocalizedText } from "#core/types/localized-text.type";
import { EdgeRenderFailure } from "#edge/enums/edge-render-failure.enum";
import { renderEdgeDocument } from "#edge/functions/render-edge-document.function";
import type { EdgeBlock } from "#edge/types/edge-block.type";

/** A stand-in for the content service's `content.entry.list` client. */
class ListEntriesQuery extends queryRef("content.entry.list@1", {
  input: z.object({ type: z.string() }),
  output: z.object({ entries: z.array(z.object({ id: z.string() })) }),
}) {}

/** Any icon: the edge never draws it (generated `Icons` constants are not available to this test). */
const ICON = "layout-grid";

@Renamed("landing.hero")
class HeroSectionBlock extends Block({
  category: BlockCategory.Marketing,
  icon: ICON,
}) {
  title!: LocalizedText;
}

class SectionBlock extends Block({
  category: BlockCategory.Layout,
  icon: ICON,
}) {}

class TestimonialsBlock extends Block({
  category: BlockCategory.Content,
  icon: ICON,
  accepts: ListEntriesQuery,
}) {}

class BrokenBlock extends Block({
  category: BlockCategory.Layout,
  icon: ICON,
}) {}

registerSchemas([
  [HeroSectionBlock, z.object({ title: z.record(z.string(), z.string()) })],
  [SectionBlock, z.object({})],
  [TestimonialsBlock, z.object({})],
  [BrokenBlock, z.object({})],
]);

const BLOCKS: readonly EdgeBlock[] = [
  {
    key: "landing.hero_section",
    block: HeroSectionBlock,
    html: (props) => `<h1>${escapeHtml(props["title"])}</h1>`,
  },
  {
    key: "landing.section",
    block: SectionBlock,
    html: (_props, children, { path }) => `<section data-path="${path}">${children}</section>`,
  },
  { key: "landing.testimonials", block: TestimonialsBlock, html: () => "<never/>" },
  {
    key: "landing.broken",
    block: BrokenBlock,
    html: () => {
      throw new Error("boom");
    },
  },
];

const OPTIONS = { locale: "ar-SA", revision: 7, blocks: BLOCKS };

describe("renderEdgeDocument", () => {
  it("renders OS blocks with localised, escaped props and their children", () => {
    const result = renderEdgeDocument(
      {
        block: "landing.section",
        children: [
          { block: "landing.hero", props: { title: { en: "Sell <online>", ar: "بع <الآن>" } } },
        ],
      },
      OPTIONS,
    );
    expect(result).toEqual({
      ok: true,
      revision: 7,
      html: '<section data-path="0"><h1>بع &lt;الآن&gt;</h1></section>',
    });
  });

  it("renders null as nothing and a list in order", () => {
    expect(renderEdgeDocument(null, OPTIONS)).toEqual({ ok: true, html: "", revision: 7 });
    const list = renderEdgeDocument(
      [{ block: "landing.section" }, { block: "landing.section" }],
      OPTIONS,
    );
    expect(list.ok && list.html).toBe(
      '<section data-path="0"></section><section data-path="1"></section>',
    );
  });

  it("sends a placeholder for a product block and a query-backed block", () => {
    const product = { block: "beautilon.booking", props: { x: '"><script>' } };
    const result = renderEdgeDocument(
      [product, { block: "landing.testimonials", input: { type: "testimonial" } }],
      OPTIONS,
    );
    expect(result.ok).toBe(true);
    const html = result.ok ? result.html : "";
    expect(html).toContain('data-stackra-block="beautilon.booking" data-stackra-path="0"');
    expect(html).toContain(`data-stackra-node="${escapeHtml(JSON.stringify(product))}"`);
    expect(html).not.toContain("<script>");
    expect(html).toContain('data-stackra-block="landing.testimonials" data-stackra-path="1"');
    expect(html).not.toContain("<never/>");
  });

  it("falls back on a malformed document or refused props, with the path and revision", () => {
    expect(renderEdgeDocument("text", OPTIONS)).toEqual({
      ok: false,
      reason: EdgeRenderFailure.InvalidDocument,
      revision: 7,
      path: "0",
    });
    expect(
      renderEdgeDocument(
        {
          block: "landing.section",
          children: [{ block: "landing.hero_section", props: { title: 3 } }],
        },
        OPTIONS,
      ),
    ).toEqual({
      ok: false,
      reason: EdgeRenderFailure.InvalidDocument,
      revision: 7,
      path: "0.children.0",
    });
  });

  it("falls back when a block throws", () => {
    expect(renderEdgeDocument({ block: "landing.broken" }, OPTIONS)).toEqual({
      ok: false,
      reason: EdgeRenderFailure.BlockFailed,
      revision: 7,
      path: "0",
    });
  });

  it("falls back when over the node, depth or byte budget", () => {
    const deep = {
      block: "landing.section",
      children: [{ block: "landing.section", children: [{ block: "landing.section" }] }],
    };
    const over = (limits: object) => renderEdgeDocument(deep, { ...OPTIONS, limits });
    expect(over({ maxNodes: 2 })).toMatchObject({
      ok: false,
      reason: EdgeRenderFailure.OverBudget,
    });
    expect(over({ maxDepth: 2 })).toMatchObject({
      ok: false,
      reason: EdgeRenderFailure.OverBudget,
      path: "0.children.0.children.0",
    });
    expect(over({ maxBytes: 40 })).toMatchObject({
      ok: false,
      reason: EdgeRenderFailure.OverBudget,
    });
    expect(over({})).toMatchObject({ ok: true });
  });
});
