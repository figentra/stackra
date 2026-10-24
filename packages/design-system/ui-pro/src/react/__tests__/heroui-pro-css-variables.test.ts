/**
 * Stackra file contract:
 * Purpose: proves the installed HeroUI Pro stylesheet reads no CSS variable that nothing defines, so a theme reaches
 *          every Pro component: each `var(--x)` it reads with no fallback is defined by HeroUI Pro itself, HeroUI's
 *          theme, Tailwind's theme or the Stackra theme, or is one of the few a component sets inline at runtime. It
 *          also proves `@stackra/ui-pro/css` reads only variables the Stackra theme, Tailwind or Pro defines (not
 *          HeroUI's defaults, so a theme missing one fails here), names only HeroUI Pro classes and `data-*` values
 *          that still exist, so a Pro release that renames one fails here instead of dropping a fix in silence, and
 *          draws every colour from a theme variable.
 * Boundary: reads the stylesheets an app imports, from the installed packages; no browser. A `var(--x, fallback)` is
 *          never undefined, so only reads without a fallback are checked.
 * Runtime: node
 * Governing contract: ADR 0310 (decisions 3 and 12); STA-458.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const read = (path: string | URL) => readFileSync(path, "utf8");

// Each specifier is written out in its `require.resolve`, so the dependency check sees which packages the test reads.
const PRO = read(require.resolve("@heroui-pro/react/css"));
const UI_PRO = read(new URL("../../../assets/public/css/ui-pro.css", import.meta.url));
const TAILWIND_THEME = read(require.resolve("tailwindcss/theme.css"));
const STACKRA_THEME = read(require.resolve("@stackra/tokens/themes/stackra/web.css"));
/** What an app imports beside HeroUI Pro: Tailwind's theme, HeroUI's theme and the Stackra theme. */
const DEFINERS = [
  PRO,
  TAILWIND_THEME,
  read(require.resolve("@heroui/styles/themes/shared/theme.css")),
  read(require.resolve("@heroui/styles/themes/default/variables.css")),
  STACKRA_THEME,
];

/**
 * Variables a component sets inline at runtime, so no stylesheet defines them: checked against HeroUI Pro
 * 1.0.0-beta.10 and React Aria Components 1.22.1. A new one is added here only after finding where it is set.
 */
const SET_AT_RUNTIME = new Set([
  "--_firefox-mask", // HeroUI Pro TextShimmer
  "--prompt-input-max-height", // HeroUI Pro PromptInput
  "--rating-partial", // HeroUI Pro Rating
  "--tree-item-level", // React Aria Tree, under HeroUI Pro's FileTree
  "--trigger-width", // React Aria Popover and ComboBox
  "--visual-viewport-height", // React Aria Modal
]);

/** The custom properties a stylesheet declares (`--x:`), `@property` registrations included. */
const declared = (css: string) =>
  [...css.matchAll(/(?:^|[{;\s(,])(--[\w-]+)\s*:|@property\s+(--[\w-]+)/g)].map(
    (match) => match[1] ?? match[2] ?? "",
  );

/** The variables a stylesheet reads with no fallback (`var(--x)`). */
const readsWithoutFallback = (css: string) =>
  new Set([...css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((match) => match[1] ?? ""));

const DEFINED = new Set(DEFINERS.flatMap(declared));

describe("HeroUI Pro's CSS variables", () => {
  it("reads only variables that a stylesheet or a component defines", () => {
    const undefinedReads = [...readsWithoutFallback(PRO)].filter(
      (name) => !DEFINED.has(name) && !SET_AT_RUNTIME.has(name),
    );
    expect(readsWithoutFallback(PRO).size).toBeGreaterThan(100);
    expect(undefinedReads).toEqual([]);
  });

  it("lists as set at runtime only variables that no stylesheet defines", () => {
    for (const name of SET_AT_RUNTIME) expect(DEFINED.has(name), name).toBe(false);
  });
});

describe("@stackra/ui-pro/css", () => {
  it("reads only variables the Stackra theme, Tailwind or HeroUI Pro defines", () => {
    const own = new Set([PRO, TAILWIND_THEME, STACKRA_THEME].flatMap(declared));
    const undefinedReads = [...readsWithoutFallback(UI_PRO)].filter((name) => !own.has(name));
    expect(undefinedReads).toEqual([]);
  });

  it("names only data-* values that the installed HeroUI Pro stylesheet still matches", () => {
    // `data-theme` is the Stackra theme's own attribute, not HeroUI Pro's.
    const attributes = [...UI_PRO.matchAll(/\[(data-(?!theme)[\w-]+)="([\w-]+)"\]/g)].map(
      ([, name, value]) => `[${name}=${value}]`,
    );
    expect(attributes.length).toBeGreaterThan(5);
    const missing = [...new Set(attributes)].filter(
      (selector) => !PRO.includes(selector) && !PRO.includes(selector.replace(/=(.+)\]/, '="$1"]')),
    );
    expect(missing).toEqual([]);
  });

  it("names only HeroUI Pro classes that the installed stylesheet still has", () => {
    const classes = new Set(
      [...UI_PRO.matchAll(/\.([a-z][\w-]*__[\w-]+)/g)].map((match) => match[1] ?? ""),
    );
    expect(classes.size).toBeGreaterThan(5);
    const missing = [...classes].filter((name) => !PRO.includes(`.${name}`));
    expect(missing).toEqual([]);
  });

  it("draws every colour from a theme variable, never a palette value", () => {
    const colours = [
      ...UI_PRO.matchAll(/(?:^|[;{\s])(color|background-color)\s*:\s*([^;]+);/g),
    ].map((match) => match[2]?.trim() ?? "");
    expect(colours.length).toBeGreaterThan(5);
    for (const value of colours)
      expect(value, value).toMatch(/^(var\(--[\w-]+\)|currentColor|oklch\(from var\(--)/);
  });
});
