/**
 * Stackra file contract:
 * Purpose: unit tests of `DOCUMENT_TEMPLATE_SCHEMA`: defaults, the locale count of each layout, repeated locales, a
 *          font that could break out of CSS, and a path that is not a path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { DOCUMENT_TEMPLATE_SCHEMA } from "#core/constants/document-template-schema.constant";

const BASE = {
  kind: "print",
  name: "receipt",
  version: "1",
  page: { widthMm: 80, marginMm: 2 },
  locales: [{ code: "en", direction: "ltr" }],
  blocks: [{ type: "text", text: { en: "Hello" } }],
};

describe("DOCUMENT_TEMPLATE_SCHEMA", () => {
  it("fills the defaults", () => {
    const parsed = DOCUMENT_TEMPLATE_SCHEMA.parse(BASE);
    expect(parsed.layout).toBe("single");
    expect(parsed.blocks[0]).toEqual({
      type: "text",
      role: "body",
      text: { en: "Hello" },
      align: "start",
    });
  });

  it("checks the locale count of the layout and refuses repeats", () => {
    expect(DOCUMENT_TEMPLATE_SCHEMA.safeParse({ ...BASE, layout: "side-by-side" }).success).toBe(
      false,
    );
    const twice = [
      { code: "en", direction: "ltr" },
      { code: "en", direction: "ltr" },
    ];
    expect(
      DOCUMENT_TEMPLATE_SCHEMA.safeParse({ ...BASE, layout: "stacked", locales: twice }).success,
    ).toBe(false);
  });

  it("refuses a font with CSS in it, another kind and a bad path", () => {
    const font = [{ code: "en", direction: "ltr", font: 'x"}body{color:red' }];
    expect(DOCUMENT_TEMPLATE_SCHEMA.safeParse({ ...BASE, locales: font }).success).toBe(false);
    expect(DOCUMENT_TEMPLATE_SCHEMA.safeParse({ ...BASE, kind: "page" }).success).toBe(false);
    const image = [{ type: "image", image: "../x", widthMm: 10, heightMm: 10 }];
    expect(DOCUMENT_TEMPLATE_SCHEMA.safeParse({ ...BASE, blocks: image }).success).toBe(false);
  });
});
