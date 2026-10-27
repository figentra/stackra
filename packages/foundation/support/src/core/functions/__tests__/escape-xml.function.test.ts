/**
 * Stackra file contract:
 * Purpose: unit tests of `escapeXml`: the five special characters become entities, plain text and allowed whitespace
 *          pass unchanged, and a character XML 1.0 cannot carry is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 2); stackra-224 (moved from seo).
 */
import { describe, expect, it } from "@stackra/testing";

import { escapeXml } from "#core/functions/escape-xml.function";

describe("escapeXml", () => {
  it("escapes the five special characters", () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&apos;f");
  });

  it("keeps a URL with no special character, and tab, line feed and carriage return", () => {
    expect(escapeXml("https://acme.test/ar-sa/store")).toBe("https://acme.test/ar-sa/store");
    expect(escapeXml("a\tb\nc\rd")).toBe("a\tb\nc\rd");
  });

  it("escapes a query string's ampersands", () => {
    expect(escapeXml("https://acme.test/store?a=1&b=2")).toBe(
      "https://acme.test/store?a=1&amp;b=2",
    );
  });

  it("refuses control characters XML cannot carry", () => {
    expect(() => escapeXml("a\u0000b")).toThrow(TypeError);
    expect(() => escapeXml("a\u001Fb")).toThrow(TypeError);
    expect(() => escapeXml("a\uFFFEb")).toThrow(TypeError);
  });
});
