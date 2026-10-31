/**
 * Stackra file contract:
 * Purpose: the motion and accessibility modes of a theme's web stylesheet (ADR 0501): the reduced and still motion
 *          levels, more contrast, reduced transparency, the text scales, the colour-blind-safe chart palette and
 *          forced colours. Each mode follows its system setting where one exists, and the provider forces it with an
 *          attribute on `<html>`: `data-motion` (`reduced`, `none`), `data-contrast="more"`,
 *          `data-transparency="reduce"`, `data-text-scale="<name>"` and `data-chart-palette="safe"`.
 * Boundary: a pure function from a Theme to CSS text, written by `renderWebCss` after the theme's own blocks so each
 *           mode overrides them.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2: motion, accessibility modes); ADR 0329 (motion layer); ADR 0320 (material);
 *                     WCAG 2.2 SC 1.4.4, 1.4.6, 1.4.11, 2.3.3.
 */
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import { materialModeVariables } from "#core/functions/material-mode-variables.function";

const block = (selector: string, lines: readonly string[]) =>
  `${selector} {\n${lines.join("\n")}\n}`;
const media = (query: string, blocks: readonly string[]) =>
  `@media ${query} {\n${blocks.map((text) => text.replaceAll(/^/gm, "  ")).join("\n")}\n}`;

/** Colour tokens as declarations of one mode. */
const colours = (tokens: readonly (readonly [string, ColorToken])[], mode: "light" | "dark") =>
  tokens.map(([name, token]) => `  --${name}: ${token[mode]};`);

/** The selectors of one colour mode under a forcing attribute on `<html>`. */
const forced = (attribute: string, mode: "light" | "dark") =>
  mode === "light"
    ? `html${attribute},\nhtml${attribute} [data-theme="light"]`
    : `html${attribute}.dark,\nhtml${attribute}[data-theme="dark"],\nhtml${attribute} [data-theme="dark"]`;

/**
 * The CSS of the motion and accessibility modes.
 * @param theme - the theme
 */
export function renderModesCss(theme: Theme): string {
  // `reduced` keeps fades: durations stay, movement goes (no press shrink, no rise on entry). The system setting's
  // block is `renderWebCss`'s one reduced-motion block.
  const still = ["  --press-scale: 1;", "  --enter-distance: 0px;"];
  const contrast = Object.entries(theme.accessibility.contrast) as [string, ColorToken][];
  const safe = theme.accessibility.chartSafe.map(
    (token, index) => [`chart-${index + 1}`, token] as const,
  );
  const solid = Object.entries(materialModeVariables("solid")).map(
    ([name, value]) => `  ${name}: ${value};`,
  );
  return [
    block('html[data-motion="reduced"],\nhtml[data-motion="none"]', still),
    media("(prefers-contrast: more)", [
      block(':root,\n[data-theme="light"]', colours(contrast, "light")),
      block('.dark,\n[data-theme="dark"]', colours(contrast, "dark")),
    ]),
    block(forced('[data-contrast="more"]', "light"), colours(contrast, "light")),
    block(forced('[data-contrast="more"]', "dark"), colours(contrast, "dark")),
    // Reduced transparency (and more contrast) forced by the provider: the material turns solid, as under the system
    // settings (ADR 0320).
    block(
      [
        'html[data-transparency="reduce"]',
        'html[data-transparency="reduce"] [data-material]',
        'html[data-contrast="more"]',
        'html[data-contrast="more"] [data-material]',
      ].join(",\n"),
      solid,
    ),
    ...Object.entries(theme.accessibility.textScales).map(([name, scale]) =>
      block(`html[data-text-scale="${name}"]`, [
        `  font-size: ${Number((scale * 100).toFixed(4))}%;`,
      ]),
    ),
    block('html[data-chart-palette="safe"],\n[data-chart-palette="safe"]', colours(safe, "light")),
    block(
      [
        'html.dark[data-chart-palette="safe"]',
        'html[data-theme="dark"][data-chart-palette="safe"]',
        '.dark [data-chart-palette="safe"]',
        '[data-theme="dark"] [data-chart-palette="safe"]',
      ].join(",\n"),
      colours(safe, "dark"),
    ),
    // Forced colours: the focus ring and links take the system's colours, and a chart keeps its own so its series stay
    // told apart.
    media("(forced-colors: active)", [
      block(":root,\n.dark,\n[data-theme]", ["  --focus: Highlight;", "  --link: LinkText;"]),
      block(".recharts-surface,\n[data-chart]", ["  forced-color-adjust: none;"]),
    ]),
  ].join("\n\n");
}
