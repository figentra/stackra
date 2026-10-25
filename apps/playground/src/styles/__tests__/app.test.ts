/**
 * Stackra file contract:
 * Purpose: guards the playground stylesheet's glass: the material comes only from @stackra/tokens, never from HeroUI
 *          Pro's glass theme (a second material, outside ADR 0320's levels, modes, fallbacks and contrast rule), and
 *          the page root is painted opaque so a glass layer always blurs a painted page.
 * Boundary: reads `src/styles/app.css` as text; the computed result is the end-to-end suite's.
 * Runtime: node
 * Governing contract: ADR 0320 (the glass material); ADR 0022 (test placement).
 */
// @covers sta-422:FR-004
// @vitest-environment node
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app.css", import.meta.url), "utf8");

describe("the playground stylesheet", () => {
  it("never loads HeroUI Pro's glass theme", () => {
    expect(css).not.toMatch(/@heroui-pro\/react\/themes\/glass/);
  });

  it("loads the material from the stackra theme", () => {
    expect(css).toContain('@import "@stackra/tokens/themes/stackra/web.css";');
  });

  it("paints the page root opaque", () => {
    expect(css).toMatch(/\nhtml \{\n {2}background-color: var\(--background\);/);
  });
});
