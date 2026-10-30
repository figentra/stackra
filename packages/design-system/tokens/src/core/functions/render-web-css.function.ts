/**
 * Stackra file contract:
 * Purpose: renders a theme to the CSS custom properties HeroUI v3 reads on the web. Mode-independent tokens go on
 *          `:root`; the colour roles, palette and shadows go on `:root, [data-theme="light"]` and
 *          `.dark, [data-theme="dark"]`, the selectors HeroUI's theming docs prescribe for theme colours. A
 *          `@layer components` block restyles HeroUI's Typography classes in the theme's type scale and draws the glass
 *          material's classes (`.material`, `.material-thin`, `.material-thick`, and `.material-bar` for a sticky top
 *          bar: the theme's own background tinted glass with foreground text). The material's levels sit in the colour
 *          blocks, its modes on `[data-material]` (solid, frosted, glass, liquid), and it turns solid under reduced
 *          transparency, more contrast or no backdrop filter (ADR 0320). HeroUI's skeleton motion follows the reading
 *          direction and stops under reduced motion. The radio and the switch are drawn round, the switch's off track
 *          on the field edge colour; HeroUI's controls, overlays, cards and chips take the radius roles. The headings
 *          take their face from the type styles, which name the display stacks (`--font-display`,
 *          `--font-display-arabic`), so a brand's display faces reach them (STA-1386).
 * Boundary: a pure function from a Theme to a string; it validates nothing (`defineTheme` does) and writes no file.
 *          The properties come from `themeVariables`, HeroUI's before Stackra's in each block.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0165 (HeroUI v3 on the web); ADR 0320 (the glass material).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import { MaterialMode } from "#contracts/enums/material-mode.enum";
import type { Theme } from "#contracts/types/theme.type";
import { CHART_RAMP } from "#core/constants/chart-ramp.constant";
import { HEROUI_TYPOGRAPHY_TOKENS } from "#core/constants/heroui-typography-tokens.constant";
import { materialModeVariables } from "#core/functions/material-mode-variables.function";
import { themeVariables } from "#core/functions/theme-variables.function";

/** Custom properties as declarations, one per line at the given indent. */
const declarations = (
  ...sets: readonly Readonly<Record<string, string>>[]
): ((indent?: string) => string[]) => {
  const entries = sets.flatMap((set) => Object.entries(set));
  return (indent = "  ") => entries.map(([name, value]) => `${indent}${name}: ${value};`);
};
const block = (selector: string, lines: readonly string[]) =>
  `${selector} {\n${lines.join("\n")}\n}`;

/**
 * HeroUI's weight modifiers, stated again after the types: the `font` shorthand of a type resets `font-weight`, and
 * HeroUI's own modifier rules sit before ours in the same layer, so without these `weight="bold"` would lose.
 */
const WEIGHT_MODIFIERS = [
  ["normal", 400],
  ["medium", 500],
  ["semibold", 600],
  ["bold", 700],
] as const;

/** A rule indented one level, for use inside the `@layer components` block. */
const inRule = (selector: string, lines: readonly string[]) =>
  `  ${selector} {\n${lines.join("\n")}\n  }`;

/**
 * The `@layer components` block that draws HeroUI's Typography classes in the theme's type scale (HeroUI's own
 * customisation route). It stays inside the layer, because an unlayered rule would beat a caller's utilities. The
 * Arabic rule uses `:where(:lang(...))`, which keeps it at one class of specificity: it wins over the Latin rule by
 * order, and the weight modifiers below still win over both. The glass material's classes and the glass button
 * variants (ADR 0319) close the block.
 */
function componentsLayer(theme: Theme): string {
  const rules = HEROUI_TYPOGRAPHY_TOKENS.filter(({ token }) => token in theme.typography).flatMap(
    ({ type, token }) => [
      inRule(`.typography--${type}`, [
        `    font: var(--${token});`,
        `    letter-spacing: var(--${token}-letter-spacing);`,
      ]),
      ...(`${token}-ar` in theme.typography
        ? [
            inRule(`.typography--${type}:where(:lang(ar))`, [
              `    font: var(--${token}-ar);`,
              `    letter-spacing: var(--${token}-ar-letter-spacing);`,
            ]),
          ]
        : []),
    ],
  );
  const weights = WEIGHT_MODIFIERS.map(([name, weight]) =>
    inRule(`.typography--weight-${name}`, [`    font-weight: ${weight};`]),
  );
  return `@layer components {\n${[...rules, ...weights, ...materialRules(), ...glassButtonRules(), ...selectionControlRules(), ...radiusRoleRules()].join("\n")}\n}`;
}

/** The selectors of every skeleton animation, which HeroUI v3 never stops under reduced motion. */
const SKELETON_MOTION = [
  ".skeleton--shimmer::after",
  ".skeleton--shimmer::before",
  ".skeleton--pulse",
].join(",\n  ");

/** The shimmer skeleton in a right-to-left context: by `:dir()`, or by a `dir="rtl"` on it or on an ancestor. */
const RTL_SHIMMER = '.skeleton--shimmer:is(:dir(rtl), [dir="rtl"], [dir="rtl"] *)';

/** One material class: the level's fill, filter, edge, rim light and sheen, over the theme's shadow. */
const materialRule = (selector: string, name: MaterialLevel, shadow: string) =>
  inRule(selector, [
    `    background-color: var(--material-${name}-fill);`,
    `    -webkit-backdrop-filter: var(--material-${name}-filter);`,
    `    backdrop-filter: var(--material-${name}-filter);`,
    "    border: 1px solid var(--material-edge);",
    `    box-shadow: inset 0 1px 0 var(--material-highlight), inset 0 14px 24px -18px var(--material-sheen-color), var(--${shadow}-shadow);`,
  ]);

/**
 * The least share of the theme's background in a bar's glass. Whatever scrolls under the bar shows through only as a
 * blurred tenth, so foreground text keeps a contrast near its own on the background in every brand theme and scheme
 * (owner decision 2026-10-28: the bars follow the theme).
 */
const BAR_SHARE = 0.88;

/**
 * The bar material: a sticky top bar's glass, the theme's own background at `BAR_SHARE` (or more, where the mode's
 * floor is higher: solid in the solid mode, so under reduced transparency, more contrast and no backdrop filter too)
 * with the thick level's blur, and foreground text. A browser without `color-mix()` paints the background solid.
 */
const barRules = () => [
  inRule(".material-bar", [
    "    background-color: var(--background);",
    "    color: var(--foreground);",
  ]),
  `  @supports (color: color-mix(in oklch, white, black)) {\n${inRule(".material-bar", [
    `    background-color: color-mix(in oklch, var(--background) calc(max(var(--material-fill-floor), ${BAR_SHARE}) * 100%), transparent);`,
    "    -webkit-backdrop-filter: var(--material-thick-filter);",
    "    backdrop-filter: var(--material-thick-filter);",
  ]).replaceAll(/^/gm, "  ")}\n  }`,
];

/** The material classes, one per level, for the components layer; `.material` is the regular level. */
const materialRules = () => [
  materialRule(".material,\n  .material-regular", "regular", "overlay"),
  materialRule(".material-thin", "thin", "surface"),
  materialRule(".material-thick", "thick", "overlay"),
  ...barRules(),
];

/**
 * The static material of a browser without `color-mix()`: every computed property, written in the colour blocks, would
 * be invalid there and leave the fill transparent, so each one gets a plain value instead (the surface, no filter, the
 * border role, no rim light or sheen). A static declaration placed before a computed one cannot do this: a declaration
 * that holds `var()` always parses, so the browser never falls back to the one before it.
 */
const staticMaterial = () =>
  [
    ...MaterialLevel.flatMap((level) => [
      `    --material-${level}-fill: var(--surface);`,
      `    --material-${level}-filter: none;`,
    ]),
    "    --material-control-fill: var(--surface);",
    "    --material-edge: var(--border);",
    "    --material-highlight: transparent;",
    "    --material-sheen-color: transparent;",
  ].join("\n");

/**
 * The glass on a control: the control fill and a hairline edge, with no backdrop filter (ADR 0319 decision 2). A blur
 * under every button costs a filter pass each and smears what sits behind a row of them; the fill alone carries the
 * material, and its floor keeps the label legible over any backdrop.
 */
const GLASS_CONTROL = ["    border: 1px solid var(--material-edge);"];

/** The control fill a little darker (light) or lighter (dark) for hover and press, from the page's own foreground. */
const glassTint = (share: number) =>
  `color-mix(in oklch, var(--material-control-fill), var(--foreground) ${share}%)`;

/**
 * HeroUI's quiet button variants on the control fill (ADR 0319), through HeroUI's own variant properties
 * (`--button-bg`, `-hover`, `-pressed`): secondary, tertiary and outline sit on glass; ghost turns glass under the
 * pointer and the press. The primary and danger variants stay solid, inside the same transparent 1px border. No box-shadow is set, so HeroUI's focus ring
 * (a ring box-shadow) stays whole; the material's fallbacks make the glass solid where it must be.
 */
const glassButtonRules = () => [
  // Every variant draws a 1px border, transparent on the solid ones, so a solid and an outlined button of one size
  // have the same box (a Cancel beside an Apply), with no box-shadow to clash with the focus ring.
  inRule(".button", ["    border: 1px solid transparent;"]),
  inRule(".button--secondary,\n  .button--tertiary,\n  .button--outline", [
    "    --button-bg: var(--material-control-fill);",
    `    --button-bg-hover: ${glassTint(8)};`,
    `    --button-bg-pressed: ${glassTint(12)};`,
    ...GLASS_CONTROL,
  ]),
  inRule(".button--ghost", [
    `    --button-bg-hover: ${glassTint(8)};`,
    `    --button-bg-pressed: ${glassTint(12)};`,
    "    border: 1px solid transparent;",
  ]),
  inRule(
    '.button--ghost:hover,\n  .button--ghost[data-hovered="true"],\n  .button--ghost[data-pressed="true"]',
    GLASS_CONTROL,
  ),
  inRule(".close-button--default", [
    "    background-color: var(--material-control-fill);",
    ...GLASS_CONTROL,
  ]),
  inRule('.close-button--default:hover,\n  .close-button--default[data-hovered="true"]', [
    `    background-color: ${glassTint(8)};`,
  ]),
];

/**
 * The selection controls in the theme's tokens. HeroUI draws the radio's ring and dot and the switch's track and thumb
 * with `rounded-lg`, which a small `--radius` turns into the checkbox's square; a radio and a switch stay round in
 * every brand, so they take `--radius-full`. The switch's off track is HeroUI's `default` fill, about 1.3:1 on the
 * dark page; it takes `field-border`, the field edge held at 3:1 against the page and the surface. Two classes each,
 * so they also win over HeroUI's size rules (`.switch--sm .switch__thumb`).
 */
const selectionControlRules = () => [
  inRule(
    ".radio .radio__control,\n  .radio .radio__indicator,\n  .radio .radio__indicator::before,\n  .switch .switch__control,\n  .switch .switch__thumb",
    ["    border-radius: var(--radius-full);"],
  ),
  inRule(".switch", ["    --switch-control-bg: var(--field-border);"]),
  // A selected toggle button is the solid accent: HeroUI's soft accent sits about 1:1 from the unselected `default`
  // fill, so the pick showed by its icon colour alone; the solid accent stands 3:1 from it (SC 1.4.11).
  inRule(".toggle-button", [
    "    --toggle-button-bg-selected: var(--accent);",
    "    --toggle-button-bg-selected-hover: var(--accent-hover);",
    "    --toggle-button-bg-selected-pressed: var(--accent-hover);",
    "    --toggle-button-fg-selected: var(--accent-foreground);",
  ]),
  // A field's help and error text take their direction from their own first letter, as `dir="auto"` would: an English
  // sentence in a right-to-left page keeps its full stop at its end, and Arabic text stays right to left.
  inRule('[data-slot="description"],\n  [data-slot="field-error"]', [
    "    unicode-bidi: plaintext;",
  ]),
  // A flexible input beside its affixes or icons takes the room its group has, never its intrinsic width (`size` 20
  // times the font's average glyph): with a wider font (Linux) that pushed the suffix out of the border, widened the
  // sidebar and the hero past a phone, and left axe the input obscured. `min-width: 0` lets it shrink in its row, as
  // HeroUI's number field does; a percentage width gives an input no min-content width (CSS Sizing 3, compressible
  // replaced elements), so its grid or flex ancestors stop growing to fit it, while flex still sizes it in the row.
  inRule(".input-group__input,\n  .search-field__input,\n  .color-input-group__input", [
    "    min-width: 0;",
    "    width: 100%;",
  ]),
  // A hovered tab is the foreground colour, not HeroUI's muted text at 70% opacity, which fell to about 3.2:1 in light
  // and 4.2:1 in dark (SC 1.4.3). The selectors repeat HeroUI's, so they win by order in the same layer.
  inRule(
    '.tabs__tab:not([data-selected="true"]):not([data-disabled="true"]):hover,\n  .tabs__tab[data-hovered="true"]:not([data-selected="true"]):not([data-disabled="true"])',
    ["    opacity: 1;", "    color: var(--foreground);"],
  ),
];

/** An element nested in one of `role`'s radius with `inset` of padding between them: the outer radius less it. */
const nested = (role: "control" | "container", inset: string) =>
  `max(0px, calc(var(--radius-${role}) - ${inset}))`;

/**
 * HeroUI's controls on the theme's radius roles (`--radius-control`, `--radius-container`, `--radius-pill`). HeroUI
 * rounds fields by `--field-radius` but buttons, toggle buttons and tabs at 3x `--radius`, menus' rows at 2x and its
 * overlays at 3x, so a search field, a button and a segmented control beside it drew three different corners. A button,
 * a toggle button and a tab list now match the field; a tab and a menu row sit inside their padded parent at its
 * radius less the padding; overlays and cards are containers; a chip is a pill. The attached group's selectors repeat
 * HeroUI's, so they win by order in the same layer.
 */
const radiusRoleRules = () => [
  inRule(".button,\n  .toggle-button,\n  .tabs__list-container", [
    "    border-radius: var(--radius-control);",
  ]),
  inRule(".toggle-button-group--horizontal .toggle-button:first-child", [
    "    border-start-start-radius: var(--radius-control);",
    "    border-end-start-radius: var(--radius-control);",
  ]),
  inRule(".toggle-button-group--horizontal .toggle-button:last-child", [
    "    border-start-end-radius: var(--radius-control);",
    "    border-end-end-radius: var(--radius-control);",
  ]),
  inRule(".toggle-button-group--vertical .toggle-button:first-child", [
    "    border-start-start-radius: var(--radius-control);",
    "    border-start-end-radius: var(--radius-control);",
  ]),
  inRule(".toggle-button-group--vertical .toggle-button:last-child", [
    "    border-end-start-radius: var(--radius-control);",
    "    border-end-end-radius: var(--radius-control);",
  ]),
  // The tab list's padding is `p-1`.
  inRule(".tabs__tab,\n  .tabs__indicator", ["    border-radius: var(--radius-control-inner);"]),
  inRule(".popover,\n  .select__popover,\n  .dropdown__popover,\n  .combo-box__popover,\n  .card", [
    "    border-radius: var(--radius-container);",
  ]),
  // A menu and a list box pad their rows by `p-1`.
  inRule(".menu-item,\n  .list-box-item", [
    `    border-radius: ${nested("container", "0.25rem")};`,
  ]),
  inRule(".chip", ["    border-radius: var(--radius-pill);"]),
  // A key cap sits inside a control (the search button), a hair in from its edge.
  inRule(".kbd", [`    border-radius: ${nested("control", "0.125rem")};`]),
];

/** The fallbacks: solid where transparency is unwanted or unsupported, a stronger edge for more contrast. */
function materialFallbacks(): string {
  const solid = declarations(materialModeVariables("solid"))("    ").join("\n");
  return [
    `@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {\n  :root,\n  [data-material] {\n${solid}\n  }\n}`,
    "@media (prefers-contrast: more) {\n  :root,\n  .dark,\n  [data-theme] {\n    --material-edge-share: 0.45;\n  }\n}",
    `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  :root,\n  [data-material] {\n${solid}\n  }\n}`,
    `@supports not (color: color-mix(in oklch, white, black)) {\n  :root,\n  .dark,\n  [data-theme] {\n${staticMaterial()}\n  }\n}`,
    "@media (forced-colors: active) {\n  .material,\n  .material-regular,\n  .material-thin,\n  .material-thick,\n  .button--secondary,\n  .button--tertiary,\n  .button--outline,\n  .close-button--default {\n    border-color: CanvasText;\n  }\n}",
  ].join("\n\n");
}

/**
 * The web stylesheet of `theme`, to load after `@import "@heroui/styles"` and outside any cascade layer (bar the
 * typography block, which is in `components` on purpose), so it overrides HeroUI's defaults. Durations drop to 0ms under `prefers-reduced-motion`, every
 * transition and animation ends at once under `<html data-motion="none">`, and `:lang(ar)` documents take
 * the Arabic font stack.
 */
/**
 * The default chart palette of one scheme: `--chart-ramp-<n>` as a relative colour of `var(--accent)`, the accent's
 * lightness clamped as the centre so every step fits the scheme's bounds, then stepped (CHART_RAMP), so the ramp follows any accent set later, a brand's or the theme studio's. A step
 * the theme's palette names itself is left to the palette.
 */
function chartRamp(theme: Theme, mode: "light" | "dark"): Record<string, string> {
  const [low, high] = CHART_RAMP.bounds[mode];
  const first = CHART_RAMP.steps[0];
  const last = CHART_RAMP.steps[4];
  // A band narrower than the steps' reach scales them to fit, spread evenly; the centre is then the band's middle.
  const scale = Math.min(1, (high - low) / (last - first));
  const centre = `clamp(${round(low - first * scale)}, l, ${round(high - last * scale)})`;
  return Object.fromEntries(
    CHART_RAMP.steps.flatMap((step, index) => {
      const name = `chart-ramp-${index + 1}`;
      if (name in theme.palette) return [];
      const move = round(Math.abs(step * scale));
      const lightness = step === 0 ? centre : `calc(${centre} ${step < 0 ? "-" : "+"} ${move})`;
      return [[`--${name}`, `oklch(from var(--accent) ${lightness} c h)`]];
    }),
  );
}

/** A bound as CSS writes it, free of floating-point dust. */
const round = (value: number) => Number(value.toFixed(3));

/** Renders a theme to the CSS custom properties HeroUI reads on the web. */
export function renderWebCss(theme: Theme): string {
  const { heroui, stackra } = themeVariables(theme);
  const motion = Object.keys(theme.motion);

  return `${[
    `/* Generated by @stackra/tokens from the "${theme.name}" theme: change the theme, not this file. */`,
    block(":root", declarations(heroui.root, stackra.root)()),
    block(
      ':root,\n[data-theme="light"]',
      declarations(heroui.light, stackra.light, chartRamp(theme, "light"))(),
    ),
    block(
      '.dark,\n[data-theme="dark"]',
      declarations(heroui.dark, stackra.dark, chartRamp(theme, "dark"))(),
    ),
    ...MaterialMode.map((mode) =>
      block(`[data-material="${mode}"]`, declarations(materialModeVariables(mode))()),
    ),
    // Unlayered, so the sweep beats HeroUI's `components` animation; `reverse` plays the keyframe backwards, which
    // starts the light on the inline-start side (HeroUI's start is the physical left, so in a right-to-left layout it
    // is the right), the way HeroUI Native sweeps in a right-to-left layout. The `[dir]` alternatives are there
    // because a build that targets browsers without `:dir()` rewrites it into a `:lang()` list, which misses an
    // English `lang` island inside a right-to-left page.
    block(`${RTL_SHIMMER}::after,\n${RTL_SHIMMER}::before`, ["  animation-direction: reverse;"]),
    `@media (prefers-reduced-motion: reduce) {\n  :root {\n${motion
      .map((name) => `    --duration-${name}: 0ms;`)
      .join("\n")}\n  }\n  ${SKELETON_MOTION} {\n    animation: none;\n  }\n}`,
    // The provider's `motion="none"` (`<html data-motion="none">`): every transition and animation ends at once, so
    // exit and enter events still fire and nothing is left mid-way.
    block('html[data-motion="none"]', [
      ...motion.map((name) => `  --duration-${name}: 0ms;`),
      "  scroll-behavior: auto;",
    ]),
    block(
      'html[data-motion="none"] *,\nhtml[data-motion="none"] *::before,\nhtml[data-motion="none"] *::after',
      [
        "  animation-duration: 0s !important;",
        "  animation-delay: 0s !important;",
        "  animation-iteration-count: 1 !important;",
        "  transition-duration: 0s !important;",
        "  transition-delay: 0s !important;",
      ],
    ),
    block(":root:lang(ar)", ["  font-family: var(--font-arabic);"]),
    componentsLayer(theme),
    materialFallbacks(),
  ].join("\n\n")}\n`;
}
