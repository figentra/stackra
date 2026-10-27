/**
 * Stackra file contract:
 * Purpose: unit tests of the node renderer: `renderServerHtml` draws a studio document as one HTML page with
 *          localised, escaped props, children, the render's data and the host's direction; a renamed key still renders;
 *          an unknown key, a block outside the kind and refused props throw before anything is drawn.
 *          `renderEmailTemplate` returns the HTML and its text part; `renderPrintDocument` prints the HTML through the
 *          `PdfEngine` on the given page and never calls it for a refused document.
 * Boundary: test only; the blocks' schemas are registered by hand in the form gen compiles them; the engine is a fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0270 (decisions 6 and 7); ADR 0365 (decision 2).
 */
import { Driver } from "@stackra/container";
import { PdfEngine, type PdfPage } from "@stackra/documents/contracts";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Renamed } from "@stackra/validation";
import { z } from "zod";
import { escapeHtml } from "@stackra/support";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import { InvalidDocumentError } from "#core/errors/invalid-document.error";
import { UnknownBlockError } from "#core/errors/unknown-block.error";
import type { LocalizedText } from "#core/types/localized-text.type";
import { renderEmailTemplate } from "#server/functions/render-email-template.function";
import { renderPrintDocument } from "#server/functions/render-print-document.function";
import { renderServerHtml } from "#server/functions/render-server-html.function";
import type { ServerBlock } from "#server/types/server-block.type";

const ICON = "layout-grid";
const BOTH = [ExperienceKind.EmailTemplate, ExperienceKind.PrintDocument];

@Renamed("mail.title")
class HeadingBlock extends Block({
  category: BlockCategory.Content,
  icon: ICON,
  kinds: BOTH,
}) {
  text!: LocalizedText;
}

class GreetingBlock extends Block({
  category: BlockCategory.Content,
  icon: ICON,
  kinds: BOTH,
}) {}

class SectionBlock extends Block({
  category: BlockCategory.Layout,
  icon: ICON,
  kinds: BOTH,
}) {}

/** A page-only block: no `kinds`, so not email-safe. */
class HeroBlock extends Block({
  category: BlockCategory.Marketing,
  icon: ICON,
}) {}

registerSchemas([
  [HeadingBlock, z.object({ text: z.record(z.string(), z.string()) })],
  [GreetingBlock, z.object({})],
  [SectionBlock, z.object({})],
  [HeroBlock, z.object({})],
]);

const BLOCKS: readonly ServerBlock[] = [
  {
    key: "mail.heading",
    block: HeadingBlock,
    html: (props) => `<h1>${escapeHtml(props["text"])}</h1>`,
  },
  {
    key: "mail.greeting",
    block: GreetingBlock,
    html: (_props, _children, { data }) => `<p>Hi ${escapeHtml(data["name"])}</p>`,
  },
  {
    key: "mail.section",
    block: SectionBlock,
    html: (_props, children, { path }) => `<div data-path="${path}">${children}</div>`,
  },
  { key: "web.hero", block: HeroBlock, html: () => "<never/>" },
];

const DOCUMENT = {
  block: "mail.section",
  children: [
    { block: "mail.title", props: { text: { en: "Order <1>", ar: "طلب <1>" } } },
    { block: "mail.greeting" },
  ],
};

const OPTIONS = {
  locale: "ar",
  direction: "rtl" as const,
  blocks: BLOCKS,
  data: { name: "Sara & co" },
  title: "Your order",
};

/** Records each print and answers fixed bytes. */
class FakePdfEngine extends Driver(PdfEngine) {
  readonly calls: { html: string; page: PdfPage }[] = [];

  async print(html: string, page: PdfPage): Promise<Uint8Array> {
    this.calls.push({ html, page });
    return new Uint8Array([37, 80, 68, 70]);
  }
}

describe("renderServerHtml", () => {
  it("renders a page with localised, escaped props, children, data and direction", () => {
    expect(renderServerHtml(DOCUMENT, ExperienceKind.EmailTemplate, OPTIONS)).toBe(
      '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Your order</title></head>' +
        '<body><div data-path="0"><h1>طلب &lt;1&gt;</h1><p>Hi Sara &amp; co</p></div></body></html>',
    );
  });

  it("renders null as an empty body, with dir auto by default", () => {
    expect(
      renderServerHtml(null, ExperienceKind.EmailTemplate, { locale: "en", blocks: BLOCKS }),
    ).toContain('dir="auto"><head><meta charset="utf-8"><title></title></head><body></body>');
  });

  it("refuses an unknown key before drawing", () => {
    expect(() =>
      renderServerHtml({ block: "product.thing" }, ExperienceKind.EmailTemplate, OPTIONS),
    ).toThrow(UnknownBlockError);
  });

  it("refuses a block outside the kind and props its schema refuses", () => {
    expect(() =>
      renderServerHtml({ block: "web.hero" }, ExperienceKind.EmailTemplate, OPTIONS),
    ).toThrow(InvalidDocumentError);
    expect(() =>
      renderServerHtml(
        { block: "mail.heading", props: { text: 3 } },
        ExperienceKind.EmailTemplate,
        OPTIONS,
      ),
    ).toThrow(InvalidDocumentError);
  });
});

describe("renderEmailTemplate", () => {
  it("returns the HTML and its text part", () => {
    const email = renderEmailTemplate(DOCUMENT, OPTIONS);
    expect(email.html).toContain("<h1>طلب &lt;1&gt;</h1>");
    expect(email.text).toBe("طلب <1>\n\nHi Sara & co");
  });
});

describe("renderPrintDocument", () => {
  const page: PdfPage = { widthMm: 80, marginMm: 2 };

  it("prints the rendered HTML on the page through the engine", async () => {
    const engine = new FakePdfEngine();
    const result = await renderPrintDocument(DOCUMENT, { ...OPTIONS, engine, page });
    expect(engine.calls).toEqual([{ html: result.html, page }]);
    expect(result.pdf).toEqual(new Uint8Array([37, 80, 68, 70]));
  });

  it("never calls the engine for a refused document", async () => {
    const engine = new FakePdfEngine();
    await expect(
      renderPrintDocument({ block: "web.hero" }, { ...OPTIONS, engine, page }),
    ).rejects.toThrow(InvalidDocumentError);
    expect(engine.calls).toEqual([]);
  });
});
