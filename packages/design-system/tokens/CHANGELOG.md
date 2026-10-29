# @stackra/tokens

## 0.1.0

### Minor Changes

- dfa0c6a: New package, part of the Stackra Design System (ADR 0302). It holds the theme schema (`Theme`, `ColorToken` and the
  HeroUI colour roles, from `@stackra/tokens/contracts`), `defineTheme`, which validates a theme and throws
  `InvalidThemeError` listing every problem, and the pure renderers `renderWebCss` (HeroUI v3 custom properties, light on
  `:root, [data-theme="light"]`, dark on `.dark, [data-theme="dark"]`) and `renderNativeCss` (the Uniwind
  `@variant light` and `@variant dark` theme HeroUI Native reads). `STACKRA_THEME` is the default theme, with the
  values `@stackra/brand` carried, unchanged; its stylesheets ship as `@stackra/tokens/themes/stackra/web.css` and
  `native.css`, and its fonts (Geist, Geist Mono, IBM Plex Sans Arabic, OFL) as `@stackra/tokens/fonts/*`.
  `@stackra/brand` is retired: its tokens are this theme, its logos and brand assets live in the docs app.
  
  `STACKRA_THEME` derives every hex from its oklch value with the new `oklchToHex`; the hex values the kit listed for the
  HeroUI base roles did not match their oklch (dark `surface` was `#25282B`, it paints `#131518`) and are corrected. The
  oklch values are unchanged. `contrastRatio` gives the WCAG 2 ratio of two hex colours.
  
  Compared with `@stackra/brand`'s stylesheets, these CSS variables are gone: `--amber-100`, `--amber-300`,
  `--amber-500`, `--amber-700`, `--amber-900` and `--amber-deep` (use `--amber`, or `--cursor` for the caret colour);
  `--ease-enter` is now `--ease-fast` and `--ease-move` is `--ease-base`. On native, the `--color-<role>` variables are
  now the HeroUI Native names, `--<role>`.
- 57f55b7: Two motion steps join `STACKRA_THEME` (ADR 0329): `reveal` (400ms, `cubic-bezier(0.22, 1, 0.36, 1)`), for an entrance,
  and `stagger` (40ms), the delay between items revealed in a row. The web stylesheet renders `--duration-reveal`,
  `--ease-reveal`, `--duration-stagger` and `--ease-stagger`, and sets both durations to `0ms` under
  `prefers-reduced-motion: reduce`. `motionTiming(theme, name)` reads a step as milliseconds and a cubic bezier for
  animation libraries in JavaScript, and throws a `RangeError` for a missing step or a timing it cannot read.
- e99b97a: `FontFamilies` gains the optional `display` and `displayArabic` stacks, which default to `sans` and `arabic` and render
  as `--font-display` and `--font-display-arabic`. The stackra theme sets its display and `h1` to `h6` styles (and their
  Arabic twins) in them, so HeroUI's headings follow a brand's display faces; the native stylesheet registers both faces
  in `@theme`. `parseThemeJson` reads a brand theme.json's §33 font keys, with `sansArabic` as an alias of `arabic`
  (`TOKEN_PATH_ALIASES`); a key left out keeps the base's stack. New exports: `fontStackOf`, `FONT_FAMILY_VARIABLES`.
  A text style's `family` may now be `display` or `displayArabic`, so reading `theme.fontFamily[style.family]` can be
  `undefined`: use `fontStackOf` (STA-1386).
- d44e69c: The glass material (ADR 0320). `Theme` gains a required `materials` block. It holds three levels (`thin`,
  `regular`, `thick`): each one's fill share of `surface` per colour mode, a px blur and a saturation, plus the edge and
  rim-light shares. `defineTheme` validates the block.
  
  `renderWebCss` writes the material:
  
  - the levels' fills and filters in the colour blocks;
  - the factors of the four modes (`solid`, `frosted`, `glass`, `liquid`) on `[data-material]`, with liquid's sheen
    scaled by the colour scheme's rim-light share, and each mode's `thickFloor`, which makes the thick level solid in
    liquid so muted text keeps 4.5:1 on it;
  - solid fallbacks for reduced transparency, more contrast and a missing `backdrop-filter`, and a static opaque
    material where `color-mix()` is unsupported;
  - the `.material`, `.material-thin` and `.material-thick` classes.
  
  New exports: `MaterialLevel`, `MaterialMode`, `ThemeMaterials` and the part types from `./contracts`, and
  `MATERIAL_MODES` from `.`. A product theme must add a `materials` block.
- 5c23791: Layers and checks (ADR 0340).
  
  - `resolveTheme(base, layers, rootPolicy?)` folds a theme through brand layers. A `ThemeLayer` is a `ThemeDiff` with an `id`, a kebab-case `name` (`themeNameOf(id)` derives one), the theme it `extends` and an optional `LayerPolicy` (`allow` and `lock` path patterns, extra contrast pairs, separation rules).
  - The fold never throws. It refuses a wrong parent, a locked or disallowed path, a widened policy, an invalid value, a hex that is not its oklch value, and a contrast pair below its minimum. Each refusal offers the nearest passing colour for the colours the last layer changed; nothing is adjusted silently.
  - A separation breach is a notice: the theme is accepted with `requiresIconAndLabel`.
  - `checkTheme(theme, pairs?)` measures `DEFAULT_CONTRAST_PAIRS` (HeroUI's role pairs) as the components paint them. That includes HeroUI's `color-mix` hover and soft colours (`HEROUI_DERIVED_COLOURS`, through `paintedColour` and `pairRatio`), with translucent colours composited over the page. `checkSeparation` and `suggestColour` complete the set.
  - `defineTheme` is unchanged, so existing themes keep working; the gates arrive only through a policy.
  - The stackra theme gains `palette.warning-hover`, one step darker than the warning colour in both schemes. HeroUI's own warning hover left the light warning button's text at 4.22:1.
- 12fe727: `renderNativeCss` writes the theme's palette as Uniwind colours (STA-455).
  
  - Each palette entry becomes `--color-<name>` in both `@variant light` and `@variant dark`.
  - HeroUI Native's own `color-mix` steps of the same name take the theme's value, as `web.css` already does:
    `accent-soft`, `accent-soft-foreground` and `accent-hover`. So native soft chips, alerts and tags paint the
    colours `checkTheme` measures.
  - The other entries become Uniwind classes, such as `bg-accent-pressed` or a product's accent ramp.
  - The committed `themes/stackra/native.css` is regenerated. For the stackra theme, the accent label holds at least
    9.2:1 on the accent, hover and pressed steps, and the soft pair holds at least 14:1, in both schemes.
- d82cd1a: <!--
  Stackra file contract:
  Purpose: the release note of stackra-213 (STA-1370) for @stackra/tokens: the neutral steel accent.
  Boundary: release notes only.
  Runtime: none (Markdown)
  Governing contract: ADR 0177 (changesets); ADR 0463.
  -->
  
  The stackra theme's accent is neutral steel (ADR 0463, figentra/brand rules §31), superseding ADR 0319's steel blue.
  
  - `accent` and `focus` are `oklch(0.546 0.03 252)` (`#647282`) light and `oklch(0.77 0.03 252)` (`#A7B6C7`) dark.
  - `accent-hover` `#576574` / `#97A6B7`, `accent-pressed` `#495766` / `#8897A8`, `accent-soft` `#E6ECF3` / `#262C33`,
    `accent-soft-foreground` `#3C4958` / `#CED9E5`.
  - Paper on the accent is 4.53:1 (light) and ink on the dark accent 9.42:1.
  - The glass quiet buttons of ADR 0319 are unchanged. `assets/data/stackra/brand.json` gains the tagline
    ("One backend, every surface." / «أساس واحد، لكل واجهة.»).
- 3a7615d: The stackra theme gets the brand's steel blue as its accent (ADR 0319).
  
  - `accent` is `oklch(0.5 0.12 248)` light and `oklch(0.72 0.11 248)` dark, with steel-blue hover, pressed and soft steps.
  - `focus` takes the accent.
  - `accent-foreground` stays paper and ink: 5.49:1 and 7.88:1 on the accent.
  
  The web stylesheet puts HeroUI's secondary, tertiary and outline button variants and the default close button on the glass material's control fill (the thick level, floored at the frosted mode's floor, with an edge and no backdrop filter), and the ghost variant on it under the pointer. Primary and danger stay solid. Under `DesignSystemProvider` an app runs in the `solid` material by default, so its quiet buttons stay opaque until it asks for glass.
- 3f61d95: Theme tools for the playground's Theme Studio, usable by any tool:
  
  - `deriveTheme(base, knobs)`: an accent, a neutral hue and tint, a radius, the faces and a name make a full, checked theme.
  - `themeVariables`: the web custom properties, split into HeroUI's and Stackra's, per mode. `renderWebCss` now writes from it, so the order of declarations in `web.css` changed.
  - `materialModeVariables`.
  - `diffTheme` and `mergeTheme`. The merge drops unsafe keys and checks the result.
  - `exportThemeJson` (`stackra.theme/1`) and `exportThemeDiff` (`stackra.theme-diff/1`).
  - `parseThemeJson`: size-capped and checked.
  - `themeToDtcg`: W3C design tokens.
  
  New types `ThemeKnobs`, `ThemeDiff` and `ThemeVariables` in `./contracts`.
- 9fa447e: Skeleton and SkeletonGroup on web and native; the web theme stops skeleton motion under reduced motion and sweeps from the inline-start side in right-to-left.
- 9fa447e: `@stackra/ui` adds `Text` and `Heading` to `./react` (HeroUI v3 Typography) and `./native` (HeroUI Native Typography),
  with `TextType`, `HeadingType`, `HeadingLevel`, `TextAlign` and the three props contracts in `./contracts`. `Text` takes
  `type` (`body`, `small`, `caption`), `tone`, `align`, `isTruncated` and `lang`; `Heading` adds a required `level`, which
  is the `h<level>` element on the web, and a `type` that defaults to the level's. Arabic text takes the theme's `-ar`
  styles. Each app adds one `@source` line for `@stackra/ui` so Tailwind and Uniwind see its tone classes.
  
  `@stackra/tokens` adds `h4`, `h5` and `h6` and their Arabic twins to the `stackra` theme (ADR 0303 decision 9), and both
  renderers now draw HeroUI's Typography in the theme's type scale: `renderWebCss` writes an `@layer components` block
  over `.typography--*` (with `:where(:lang(ar))` twins and the weight modifiers), `renderNativeCss` writes
  `.text__root--type-*` in px and a `.type-<token>-ar` class per Arabic twin. `defineTheme` now refuses a type style whose
  `size` is not in px, whose `lineHeight` is not unitless or in px, or whose `letterSpacing` is not zero, `em` or px.
  The committed `web.css` and `native.css` are regenerated.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [59ac846]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
