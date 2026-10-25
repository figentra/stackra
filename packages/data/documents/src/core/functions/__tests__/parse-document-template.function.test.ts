/**
 * Stackra file contract:
 * Purpose: unit tests of `parseDocumentTemplate`: a valid template comes back with defaults; an invalid one throws
 *          `InvalidDocumentTemplateError` with the broken path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";

const TEMPLATE = {
  kind: "print",
  name: "letter",
  version: "1",
  page: { widthMm: 210, heightMm: 297, marginMm: 15 },
  locales: [{ code: "en", direction: "ltr" }],
  blocks: [],
};

describe("parseDocumentTemplate", () => {
  it("answers the template with its defaults", () => {
    expect(parseDocumentTemplate(TEMPLATE).layout).toBe("single");
  });

  it("refuses a broken template with its path", () => {
    let caught: unknown;
    try {
      parseDocumentTemplate({ ...TEMPLATE, page: { widthMm: -1, marginMm: 0 } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InvalidDocumentTemplateError);
    expect((caught as InvalidDocumentTemplateError).path).toBe("page.widthMm");
  });
});
