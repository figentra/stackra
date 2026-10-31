/**
 * Stackra file contract:
 * Purpose: proves the motion and accessibility modes of the web stylesheet: `reduced` and `none` stop movement but not
 *          fades, more contrast swaps the theme's contrast roles under the system setting and the provider's attribute,
 *          the material turns solid when the provider asks for reduced transparency, each text scale sets the root
 *          size, the safe chart palette replaces `--chart-<n>` in both schemes, and forced colours keep charts.
 * Boundary: pure; reads the CSS text.
 * Runtime: node
 * Governing contract: ADR 0501 (tokens v2, accessibility modes); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { motionDurationNames } from "#core/functions/motion-duration-names.function";
import { renderModesCss } from "#core/functions/render-modes-css.function";
import { renderWebCss } from "#core/functions/render-web-css.function";

const css = renderModesCss(STACKRA_THEME);

describe("renderModesCss", () => {
  it("stops movement, not fades, at the reduced level", () => {
    expect(css).toContain(
      'html[data-motion="reduced"],\nhtml[data-motion="none"] {\n  --press-scale: 1;',
    );
    expect(renderWebCss(STACKRA_THEME)).toContain(
      "    --press-scale: 1;\n    --enter-distance: 0px;\n  }",
    );
    expect(motionDurationNames(STACKRA_THEME)).toEqual(
      expect.arrayContaining(["--duration-base", "--spring-snappy-duration"]),
    );
    expect(renderWebCss(STACKRA_THEME)).toContain("--spring-snappy-duration: 0ms;");
  });

  it("swaps the contrast roles under the system setting and the provider's attribute", () => {
    const muted = STACKRA_THEME.accessibility.contrast.muted;
    expect(css).toContain(`@media (prefers-contrast: more)`);
    expect(css).toContain(
      `html[data-contrast="more"],\nhtml[data-contrast="more"] [data-theme="light"] {`,
    );
    expect(css).toContain(`  --muted: ${muted?.light};`);
    expect(css).toContain(`  --muted: ${muted?.dark};`);
  });

  it("turns the material solid, scales the text and swaps the chart palette", () => {
    expect(css).toContain('html[data-transparency="reduce"] [data-material]');
    expect(css).toContain('html[data-text-scale="large"] {\n  font-size: 112.5%;\n}');
    expect(css).toContain(`  --chart-1: ${STACKRA_THEME.accessibility.chartSafe[0]?.light};`);
    expect(css).toContain(`  --chart-1: ${STACKRA_THEME.accessibility.chartSafe[0]?.dark};`);
    expect(css).toContain("forced-color-adjust: none;");
  });
});
