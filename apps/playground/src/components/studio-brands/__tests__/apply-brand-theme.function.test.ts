/**
 * Stackra file contract:
 * Purpose: proves picking a brand rewrites the showcase's theme style with its CSS and display faces and is read back
 *          on the next load; an unknown stored brand falls back to Figentra.
 * Boundary: jsdom, with localStorage cleared around each test.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2); ADR 0022 (test placement).
 */
import { BRAND_THEMES } from "#src/constants/brand-themes";
import { applyBrandTheme, readActiveBrand } from "#src/components/studio-brands";

describe("applyBrandTheme", () => {
  afterEach(() => {
    localStorage.clear();
    document.getElementById("showcase-theme")?.remove();
  });

  it("draws the brand and remembers it", () => {
    const organza = BRAND_THEMES.find(({ id }) => id === "organza");
    if (!organza) throw new Error("organza is not vendored");
    applyBrandTheme(organza);
    const css = document.getElementById("showcase-theme")?.textContent ?? "";
    expect(css).toContain("--accent");
    expect(css).toContain('--brand-font-display:"Bodoni Moda"');
    expect(readActiveBrand().id).toBe("organza");
  });

  it("opens on Stackra when the stored brand is unknown", () => {
    localStorage.setItem("stackra-playground:brand", "gone");
    expect(readActiveBrand().id).toBe("stackra");
  });
});
