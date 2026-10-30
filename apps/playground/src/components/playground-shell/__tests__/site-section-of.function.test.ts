/**
 * Stackra file contract:
 * Purpose: proves `siteSectionOf` lights Components on every registry page (the foundations included) and otherwise
 *          takes the section a matched route's handle declares, none on the home page.
 * Boundary: a pure function; no DOM.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { siteSectionOf } from "#src/components/playground-shell/site-section-of.function";

describe("siteSectionOf", () => {
  it("lights Components on a registry page, whatever the handles say", () => {
    expect(siteSectionOf(true, [undefined])).toBe("components");
  });

  it("takes the first section a handle declares, and none when no handle declares one", () => {
    expect(siteSectionOf(false, [undefined, { fullscreen: true, section: "studio" }])).toBe(
      "studio",
    );
    expect(siteSectionOf(false, [{ section: "components" }])).toBe("components");
    expect(siteSectionOf(false, [undefined, {}])).toBeUndefined();
  });
});
