/**
 * Stackra file contract:
 * Purpose: the path-stability test of ADR 0340 decision 6: every token path the stackra theme has published still
 *          resolves, as itself or through `TOKEN_PATH_ALIASES` to a live path, so a stored layer naming it is never
 *          refused after a rename; no alias source is live again; and every live path is in the published list, so a new
 *          token joins it (and a later rename of it needs an alias). Also proves the brand theme.json spelling
 *          `fontFamily.sansArabic` (brand rules §33) lands on the arabic stack.
 * Boundary: in-memory theme; the published list below only grows.
 * Runtime: node
 * Governing contract: ADR 0340 (decision 6); ADR 0022 (test placement).
 */
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { TOKEN_PATH_ALIASES } from "#core/constants/token-path-aliases.constant";
import { TOKEN_SET_VERSION } from "#core/constants/token-set-version.constant";
import { aliasThemeDiff } from "#core/functions/alias-theme-diff.function";

/** Every token path published, by group; a removed or renamed one stays here. */
const PUBLISHED: Readonly<Record<string, readonly string[]>> = {
  colors: [
    "background",
    "foreground",
    "surface",
    "surface-foreground",
    "surface-secondary",
    "surface-secondary-foreground",
    "surface-tertiary",
    "surface-tertiary-foreground",
    "overlay",
    "overlay-foreground",
    "muted",
    "default",
    "default-foreground",
    "accent",
    "accent-foreground",
    "success",
    "success-foreground",
    "warning",
    "warning-foreground",
    "danger",
    "danger-foreground",
    "field-background",
    "field-foreground",
    "field-placeholder",
    "field-border",
    "segment",
    "segment-foreground",
    "border",
    "separator",
    "focus",
    "link",
    "backdrop",
  ],
  palette: [
    "amber",
    "ink",
    "paper",
    "white",
    "steel",
    "steel-deep",
    "stk-tile",
    "stk-tile-line",
    "stk-ink",
    "graphite-100",
    "graphite-200",
    "graphite-300",
    "graphite-700",
    "graphite-800",
    "graphite-900",
    "accent-hover",
    "accent-pressed",
    "accent-soft",
    "accent-soft-foreground",
    "signal",
    "signal-foreground",
    "cursor",
    "amber-strong",
    "warning-hover",
    "banner-sandbox",
    "banner-sandbox-foreground",
    "banner-staging",
    "banner-staging-foreground",
    "banner-acting-as",
    "banner-acting-as-foreground",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
  ],
  fontFamily: ["sans", "mono", "arabic"],
  typography: [
    "display",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "body",
    "small",
    "caption",
    "mono",
    "label",
    "display-ar",
    "h1-ar",
    "h2-ar",
    "h3-ar",
    "h4-ar",
    "h5-ar",
    "h6-ar",
    "body-ar",
    "small-ar",
    "caption-ar",
  ],
  spacing: ["1", "2", "3", "4", "5", "6", "8", "10", "12", "16", "18", "20"],
  radius: ["base", "field", "steps.sm", "steps.lg", "steps.full", "steps.app-tile"],
  shadows: ["surface", "overlay", "field", "raised", "pressed", "floating"],
  motion: [
    "tick",
    "emphasis",
    "hold",
    "hover-open",
    "hover-close",
    "instant",
    "fast",
    "moderate",
    "base",
    "slow",
    "indicator",
    "blink",
    "pulse",
    "count",
    "reveal",
    "stagger",
    "slower",
    "overlay-in",
    "overlay-out",
    "toast-in",
    "toast-out",
  ],
  typeScale: ["sizes", "weights", "tracking", "leading", "numeric", "arabic"],
  layout: [
    "spacing",
    "controlHeight",
    "iconSize",
    "touchTarget",
    "page",
    "breakpoints",
    "borderWidth",
    "fieldBorderWidth",
    "cornerShape",
    "vibrant",
    "cursor",
    "skeleton",
    "animations",
    "focusRing",
    "state",
    "opacity",
    "sizes",
    "zIndex",
    "regions",
  ],
  locale: ["mirrorIcons", "digits"],
  animation: [
    "easings.standard",
    "easings.emphasized",
    "easings.enter",
    "easings.exit",
    "springs.gentle",
    "springs.snappy",
    "springs.bouncy",
    "springs.follow",
    "springs.settle",
    "springs.flip",
    "springs.morph",
    "springs.default",
    "springs.sheet",
    "pressScale",
    "enterDistance",
  ],
  haptics: ["selection", "light", "impact", "medium", "rigid", "success", "warning", "error"],
  accessibility: [
    "contrast.muted",
    "contrast.field-placeholder",
    "contrast.field-border",
    "contrast.border",
    "contrast.separator",
    "contrast.focus",
    "textScales.large",
    "textScales.larger",
    "textScales.largest",
    "chartSafe",
  ],
  materials: [
    "levels.thin",
    "levels.regular",
    "levels.thick",
    "edge",
    "highlight",
    "levels.ultra-thin",
    "levels.glass",
    "levels.glass-clear",
  ],
};

const published = Object.entries(PUBLISHED).flatMap(([group, names]) =>
  names.map((name) => `${group}.${name}`),
);

/** Every token path the stackra theme has now. */
const live = new Set([
  ...(
    [
      "colors",
      "palette",
      "fontFamily",
      "typography",
      "spacing",
      "shadows",
      "motion",
      "typeScale",
      "layout",
      "locale",
    ] as const
  ).flatMap((group) => Object.keys(STACKRA_THEME[group]).map((name) => `${group}.${name}`)),
  "radius.base",
  "radius.field",
  ...Object.keys(STACKRA_THEME.radius.steps).map((name) => `radius.steps.${name}`),
  ...Object.keys(STACKRA_THEME.materials.levels).map((level) => `materials.levels.${level}`),
  "materials.edge",
  "materials.highlight",
  ...(["easings", "springs"] as const).flatMap((group) =>
    Object.keys(STACKRA_THEME.animation[group]).map((name) => `animation.${group}.${name}`),
  ),
  "animation.pressScale",
  "animation.enterDistance",
  ...Object.keys(STACKRA_THEME.haptics).map((name) => `haptics.${name}`),
  ...(["contrast", "textScales"] as const).flatMap((group) =>
    Object.keys(STACKRA_THEME.accessibility[group]).map((name) => `accessibility.${group}.${name}`),
  ),
  "accessibility.chartSafe",
]);

/** The path a published one resolves to today: a one-leaf diff at it, through the alias map. */
function resolved(path: string): string {
  const diff = path
    .split(".")
    .reduceRight<unknown>((child, key) => ({ [key]: child }), { probe: true }) as ThemeDiff;
  return leafOf(aliasThemeDiff(diff), []).join(".");
}

/** The path to the first leaf of `value`, below `prefix`; the `probe` leaf ends it. */
function leafOf(value: unknown, prefix: readonly string[]): readonly string[] {
  const entry = typeof value === "object" && value !== null ? Object.entries(value)[0] : undefined;
  return entry && entry[0] !== "probe" ? leafOf(entry[1], [...prefix, entry[0]]) : prefix;
}

// @covers sta-348:FR-003
describe("TOKEN_PATH_ALIASES", () => {
  it("keeps every published path resolvable, as itself or through an alias to a live path", () => {
    expect(published.filter((path) => !live.has(resolved(path)))).toEqual([]);
  });

  it("never names a live path as an alias source, and points every alias at a live path", () => {
    for (const [from, to] of Object.entries(TOKEN_PATH_ALIASES)) {
      expect(live.has(from), from).toBe(false);
      expect(live.has(to), to).toBe(true);
    }
  });

  it("lists every live path as published, so a new token cannot be renamed without an alias later", () => {
    expect([...live].filter((path) => !published.includes(path))).toEqual([]);
  });

  it("moves the mark's amber bar to its neutral name in token set 1", () => {
    expect(TOKEN_SET_VERSION).toBe(1);
    expect(TOKEN_PATH_ALIASES["palette.cursor"]).toBe("palette.amber-strong");
  });

  // @covers sta-1386
  it("reads brand rules §33's sansArabic as the arabic stack", () => {
    expect(
      aliasThemeDiff({
        fontFamily: { sansArabic: '"Markazi Text", serif' },
      } as unknown as ThemeDiff),
    ).toEqual({
      fontFamily: { arabic: '"Markazi Text", serif' },
    });
  });
});
