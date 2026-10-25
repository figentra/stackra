/**
 * Stackra file contract:
 * Purpose: renders a theme to the CSS custom properties HeroUI v3 reads on the web. Mode-independent tokens go on
 *          `:root`; the colour roles, palette and shadows go on `:root, [data-theme="light"]` and
 *          `.dark, [data-theme="dark"]`, the selectors HeroUI's theming docs prescribe for theme colours. A
 *          `@layer components` block restyles HeroUI's Typography classes in the theme's type scale and draws the glass
 *          material's classes (`.material`, `.material-thin`, `.material-thick`). The material's levels sit in the colour
 *          blocks, its modes on `[data-material]` (solid, frosted, glass, liquid), and it turns solid under reduced
 *          transparency, more contrast or no backdrop filter (ADR 0320). HeroUI's skeleton motion follows the reading
 *          direction and stops under reduced motion.
 * Boundary: a pure function from a Theme to a string; it validates nothing (`defineTheme` does) and writes no file.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0165 (HeroUI v3 on the web); ADR 0320 (the glass material).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import { MaterialMode } from "#contracts/enums/material-mode.enum";
import type { Theme } from "#contracts/types/theme.type";
import { HEROUI_TYPOGRAPHY_TOKENS } from "#core/constants/heroui-typography-tokens.constant";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";

const SHADOWS = ["surface", "overlay", "field"] as const;
const FONT_FAMILIES = ["sans", "mono", "arabic"] as const;
const declare = (name: string, value: string) => `  --${name}: ${value};`;
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
 * order, and the weight modifiers below still win over both. The glass material's classes close the block.
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
  return `@layer components {\n${[...rules, ...weights, ...materialRules()].join("\n")}\n}`;
}

/** The selectors of every skeleton animation, which HeroUI v3 never stops under reduced motion. */
const SKELETON_MOTION = [
  ".skeleton--shimmer::after",
  ".skeleton--shimmer::before",
  ".skeleton--pulse",
].join(",\n  ");

/** The shimmer skeleton in a right-to-left context: by `:dir()`, or by a `dir="rtl"` on it or on an ancestor. */
const RTL_SHIMMER = '.skeleton--shimmer:is(:dir(rtl), [dir="rtl"], [dir="rtl"] *)';

/** The mode factors as custom properties, for a `[data-material]` block or a fallback. */
const modeFactors = (mode: MaterialMode, indent = "  ") => {
  const factors = MATERIAL_MODES[mode];
  return [
    `${indent}--material-fill-scale: ${factors.fillScale};`,
    `${indent}--material-fill-floor: ${factors.fillFloor};`,
    `${indent}--material-thick-floor: ${factors.thickFloor};`,
    `${indent}--material-blur-scale: ${factors.blurScale};`,
    `${indent}--material-saturate-scale: ${factors.saturationScale};`,
    `${indent}--material-brightness: ${factors.brightness};`,
    `${indent}--material-sheen: ${factors.sheen};`,
  ];
};

/** The least fill share of a level: the mode's floor, and for the thick level, which muted text sits on, its own too. */
const floorOf = (level: MaterialLevel) =>
  level === "thick"
    ? "max(var(--material-fill-floor), var(--material-thick-floor))"
    : "var(--material-fill-floor)";

/**
 * The material's properties of one colour mode: each level's share of the surface, and the fills, filters, edge, rim
 * light and sheen computed from the shares and the mode factors. They sit in the colour blocks, so a subtree with its
 * own `data-theme` computes them again from its own colours.
 */
function materialColours(theme: Theme, mode: "light" | "dark"): string[] {
  const { levels, edge, highlight } = theme.materials;
  return [
    ...MaterialLevel.flatMap((level) => [
      declare(`material-${level}-share`, String(levels[level].fill[mode])),
      declare(
        `material-${level}-fill`,
        `color-mix(in oklch, var(--surface) calc(clamp(${floorOf(level)}, var(--material-${level}-share) * var(--material-fill-scale), 1) * 100%), transparent)`,
      ),
      declare(
        `material-${level}-filter`,
        `blur(calc(var(--material-${level}-blur) * var(--material-blur-scale))) saturate(calc(var(--material-${level}-saturate) * var(--material-saturate-scale))) brightness(var(--material-brightness))`,
      ),
    ]),
    declare("material-edge-share", String(edge[mode])),
    declare("material-highlight-share", String(highlight[mode])),
    declare(
      "material-edge",
      "color-mix(in oklch, var(--foreground) calc(var(--material-edge-share) * 100%), transparent)",
    ),
    declare(
      "material-highlight",
      "color-mix(in oklch, oklch(1 0 0) calc(var(--material-highlight-share) * 100%), transparent)",
    ),
    declare(
      "material-sheen-color",
      "color-mix(in oklch, oklch(1 0 0) calc(var(--material-sheen) * var(--material-highlight-share) * 100%), transparent)",
    ),
  ];
}

/** One material class: the level's fill, filter, edge, rim light and sheen, over the theme's shadow. */
const materialRule = (selector: string, name: MaterialLevel, shadow: string) =>
  inRule(selector, [
    `    background-color: var(--material-${name}-fill);`,
    `    -webkit-backdrop-filter: var(--material-${name}-filter);`,
    `    backdrop-filter: var(--material-${name}-filter);`,
    "    border: 1px solid var(--material-edge);",
    `    box-shadow: inset 0 1px 0 var(--material-highlight), inset 0 14px 24px -18px var(--material-sheen-color), var(--${shadow}-shadow);`,
  ]);

/** The material classes, one per level, for the components layer; `.material` is the regular level. */
const materialRules = () => [
  materialRule(".material,\n  .material-regular", "regular", "overlay"),
  materialRule(".material-thin", "thin", "surface"),
  materialRule(".material-thick", "thick", "overlay"),
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
    "    --material-edge: var(--border);",
    "    --material-highlight: transparent;",
    "    --material-sheen-color: transparent;",
  ].join("\n");

/** The fallbacks: solid where transparency is unwanted or unsupported, a stronger edge for more contrast. */
function materialFallbacks(): string {
  const solid = modeFactors("solid", "    ").join("\n");
  return [
    `@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {\n  :root,\n  [data-material] {\n${solid}\n  }\n}`,
    "@media (prefers-contrast: more) {\n  :root,\n  .dark,\n  [data-theme] {\n    --material-edge-share: 0.45;\n  }\n}",
    `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  :root,\n  [data-material] {\n${solid}\n  }\n}`,
    `@supports not (color: color-mix(in oklch, white, black)) {\n  :root,\n  .dark,\n  [data-theme] {\n${staticMaterial()}\n  }\n}`,
    "@media (forced-colors: active) {\n  .material,\n  .material-regular,\n  .material-thin,\n  .material-thick {\n    border-color: CanvasText;\n  }\n}",
  ].join("\n\n");
}

/**
 * The web stylesheet of `theme`, to load after `@import "@heroui/styles"` and outside any cascade layer (bar the
 * typography block, which is in `components` on purpose), so it overrides HeroUI's defaults. Durations drop to 0ms under `prefers-reduced-motion`, and `:lang(ar)` documents take
 * the Arabic font stack.
 */
export function renderWebCss(theme: Theme): string {
  const colours = (mode: "light" | "dark") => [
    ...ColorRole.map((role) => declare(role, theme.colors[role][mode])),
    ...Object.entries(theme.palette).map(([name, token]) => declare(name, token[mode])),
    ...SHADOWS.map((shadow) => declare(`${shadow}-shadow`, theme.shadows[shadow][mode])),
    ...materialColours(theme, mode),
  ];
  const motion = Object.entries(theme.motion);

  return `${[
    `/* Generated by @stackra/tokens from the "${theme.name}" theme: change the theme, not this file. */`,
    block(":root", [
      ...FONT_FAMILIES.map((family) => declare(`font-${family}`, theme.fontFamily[family])),
      ...Object.entries(theme.typography).flatMap(([name, style]) => [
        declare(
          name,
          `${style.weight} ${style.size}/${style.lineHeight} var(--font-${style.family})`,
        ),
        declare(`${name}-letter-spacing`, style.letterSpacing),
      ]),
      ...Object.entries(theme.spacing).map(([name, size]) => declare(`space-${name}`, size)),
      declare("radius", theme.radius.base),
      declare("field-radius", theme.radius.field),
      ...Object.entries(theme.radius.steps).map(([name, size]) => declare(`radius-${name}`, size)),
      ...motion.flatMap(([name, step]) => [
        declare(`duration-${name}`, step.duration),
        declare(`ease-${name}`, step.easing),
      ]),
      ...MaterialLevel.flatMap((level) => [
        declare(`material-${level}-blur`, theme.materials.levels[level].blur),
        declare(`material-${level}-saturate`, String(theme.materials.levels[level].saturation)),
      ]),
      ...modeFactors("glass"),
    ]),
    block(':root,\n[data-theme="light"]', colours("light")),
    block('.dark,\n[data-theme="dark"]', colours("dark")),
    ...MaterialMode.map((mode) => block(`[data-material="${mode}"]`, modeFactors(mode))),
    // Unlayered, so the sweep beats HeroUI's `components` animation; `reverse` plays the keyframe backwards, which
    // starts the light on the inline-start side (HeroUI's start is the physical left, so in a right-to-left layout it
    // is the right), the way HeroUI Native sweeps in a right-to-left layout. The `[dir]` alternatives are there
    // because a build that targets browsers without `:dir()` rewrites it into a `:lang()` list, which misses an
    // English `lang` island inside a right-to-left page.
    block(`${RTL_SHIMMER}::after,\n${RTL_SHIMMER}::before`, ["  animation-direction: reverse;"]),
    `@media (prefers-reduced-motion: reduce) {\n  :root {\n${motion
      .map(([name]) => `    --duration-${name}: 0ms;`)
      .join("\n")}\n  }\n  ${SKELETON_MOTION} {\n    animation: none;\n  }\n}`,
    block(":root:lang(ar)", ["  font-family: var(--font-arabic);"]),
    componentsLayer(theme),
    materialFallbacks(),
  ].join("\n\n")}\n`;
}
