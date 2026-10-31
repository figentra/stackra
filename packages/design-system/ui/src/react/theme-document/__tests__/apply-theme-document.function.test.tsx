/**
 * Stackra file contract:
 * Purpose: proves `applyThemeDocument` writes a document's theme into one stylesheet, replaces it on the next apply,
 *          writes a scoped one beside it, and leaves the page alone when the document is refused.
 * Boundary: jsdom; the real @stackra/tokens.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0501 (section 5); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import {
  createThemeDocument,
  deriveTheme,
  InvalidThemeError,
  STACKRA_THEME,
} from "@stackra/tokens";

import { applyThemeDocument } from "#react/theme-document/apply-theme-document.function";

const documentOf = (spacing: number) =>
  createThemeDocument(STACKRA_THEME, deriveTheme(STACKRA_THEME, { spacing }), {
    id: "compact",
    label: "Compact",
    status: "published",
  });

describe("applyThemeDocument", () => {
  afterEach(() => {
    for (const style of document.head.querySelectorAll("style")) style.remove();
  });

  it("writes the theme into one stylesheet and replaces it on the next apply", () => {
    applyThemeDocument(documentOf(3.6));
    applyThemeDocument(documentOf(4.4));
    const sheets = document.head.querySelectorAll("style#stackra-theme");
    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.textContent).toContain("--spacing: 0.275rem;");
  });

  it("writes a scoped theme beside the page's", () => {
    const theme = applyThemeDocument(documentOf(3.6), { scope: '[data-preset="compact"]' });
    expect(theme.layout.spacing).toBe("0.225rem");
    const style = document.getElementById('stackra-theme:[data-preset="compact"]');
    expect(style?.textContent).toContain('[data-preset="compact"] {');
  });

  it("keeps the page's theme when the document is refused", () => {
    expect(() => applyThemeDocument({ format: "nope" })).toThrow(InvalidThemeError);
    expect(document.head.querySelectorAll("style")).toHaveLength(0);
  });
});
