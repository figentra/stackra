# @stackra/tokens

Stackra Design System tokens: the theme schema, the default stackra theme and its HeroUI web and Uniwind native CSS.

**Tier:** `tier:lib` (`packages/design-system/tokens`). Part of the Stackra Design System (ADR 0302), laid out in the
programming model v3 (ADR 0294, 0295).

A theme is one typed object: the HeroUI colour roles for light and dark (oklch, with the sRGB hex derived from it), a
brand palette, font stacks,
type scale, spacing, radii, shadows and motion. `defineTheme` checks it; `renderWebCss` and `renderNativeCss` turn it
into the CSS custom properties HeroUI v3 (web) and HeroUI Native with Uniwind (native) read. The `stackra` theme is the
default; a product brings its own brand as its own theme.

## Use the stackra theme

```css
/* Web: Tailwind v4 + HeroUI v3, outside any cascade layer, after HeroUI */
@import "tailwindcss";
@import "@heroui/styles";
@import "@stackra/tokens/fonts/fonts.css";
@import "@stackra/tokens/themes/stackra/web.css";
```

```css
/* Native: the Uniwind entry CSS, after HeroUI Native */
@import "tailwindcss";
@import "uniwind";
@import "heroui-native/styles";
@import "@stackra/tokens/themes/stackra/native.css";
```

Both files also draw HeroUI's Typography in the theme's type scale. The web file does it in one `@layer components`
block that restyles `.typography--h1` to `.typography--body-xs` from the `h1` to `h6`, `body`, `small` and `caption`
tokens (with `:where(:lang(ar))` twins from the `-ar` tokens, and the weight modifiers restated after them). The native
file writes `.text__root--type-*` in absolute px for HeroUI Native's text, and one `.type-<token>-ar` class per Arabic
twin for `@stackra/ui`'s native Text to add. `defineTheme` therefore wants each type style's `size` in px, its
`lineHeight` unitless or in px, and its `letterSpacing` zero, in `em` or in px.

The web file switches modes the HeroUI way: light on `:root` and `[data-theme="light"]`, dark on `.dark` and
`[data-theme="dark"]`. The native file defines the same variables in Uniwind's `@variant light` and `@variant dark`;
switch with `Uniwind.setTheme`. Expo cannot load woff2, so native text uses the system face until TTF builds of the
fonts are added.

## Bring your own theme

```ts
import {
  defineTheme,
  oklchToHex,
  renderNativeCss,
  renderWebCss,
  STACKRA_THEME,
} from "@stackra/tokens";

const color = (light: string, dark: string) => ({
  light,
  dark,
  hexLight: oklchToHex(light),
  hexDark: oklchToHex(dark),
});

export const ACME_THEME = defineTheme({
  ...STACKRA_THEME,
  name: "acme",
  colors: { ...STACKRA_THEME.colors, accent: color("oklch(0.55 0.2 260)", "oklch(0.7 0.16 260)") },
});

const webCss = renderWebCss(ACME_THEME); // write it to a .css file at build time
```

Derive each hex with `oklchToHex` rather than typing it: a typed hex drifts from the oklch the browser paints.
`contrastRatio(hexA, hexB)` gives the WCAG 2 ratio of two opaque colours.

`defineTheme` throws `InvalidThemeError` (code `invalid_theme`, category `validation`) listing every missing role, empty
value, bad hex, non-kebab token name, two tokens that would write the same CSS custom property (a palette entry named
`radius` or `space-1`, say), and every value outside its kind's grammar. The grammars are allow-lists (a colour is hex,
`oklch()`, `oklab()`, `rgb()`, `hsl()`, `var()` or a few keywords; a length is a number with `px`, `rem`, `em` or `%`;
a font stack is family names; a shadow is lengths, colours and `inset`; a duration is `ms` or `s`; an easing is a
keyword, `cubic-bezier()`, `steps()` or `linear()`), so no value can escape its CSS declaration.

## Entry points

| Import                      | Holds                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/tokens`           | `STACKRA_THEME`, `MATERIAL_MODES`, `defineTheme`, `renderWebCss`, `renderNativeCss`, `oklchToHex`, `contrastRatio`, `InvalidThemeError`, `TokensConfig` |
| `@stackra/tokens/contracts` | the schema: `Theme`, `ColorToken`, `ThemeColors`, `ThemeMaterials`, `ColorRole`, `MaterialLevel`, `MaterialMode`, and the part types                    |
| `@stackra/tokens/node`      | `TokensModule`, the root module                                                                                                                         |
| `@stackra/tokens/themes/*`  | `assets/public/themes/`: `stackra/web.css`, `stackra/native.css`                                                                                        |
| `@stackra/tokens/fonts/*`   | `assets/public/fonts/`: Geist, Geist Mono, IBM Plex Sans Arabic (woff2), `fonts.css`, the OFL texts                                                     |
| `@stackra/tokens/assets/*`  | any file under `assets/`                                                                                                                                |

`.` and `./contracts` name stand-in barrels (`src/core/index.ts`, `src/contracts/index.ts`) until `stackra gen` writes
the entry barrels (STA-339). `exports` point at source through the `@stackra/source` condition; `tsdown` builds `dist/`
for publishing (ADR 0025).

## The glass material

`Theme.materials` is the glass material of ADR 0320. It is for showcase and marketing surfaces; product UI stays
solid. The web stylesheet draws it as three classes:

| Class                                | Level     | Use                                                    |
| ------------------------------------ | --------- | ------------------------------------------------------ |
| `.material-thin`                     | `thin`    | small chrome without reading text: tiles, chips on art |
| `.material` (or `.material-regular`) | `regular` | bars, cards, panels with `foreground` text only        |
| `.material-thick`                    | `thick`   | anything with muted text: sheets, palettes, cards      |

Set the degree once on `<html data-material="…">`. With no attribute the stylesheet draws `glass`;
`@stackra/ui`'s `DesignSystemProvider` sets `solid` unless it is given another mode, so product UI is opaque:

- `solid`: opaque.
- `frosted`: a dense fill and a heavy blur.
- `glass`: the theme as written.
- `liquid`: a thinner fill, a lifted backdrop and a sheen along the top edge. The sheen takes the colour scheme's
  rim-light share, so it is bright on light and faint on dark. The `thick` level is solid in liquid.

Reduced transparency, more contrast and a browser without `backdrop-filter` all force `solid`; a browser without
`color-mix()` gets a static opaque material. Forced colours keep the edge. Reading text on the `regular` and `thick`
levels holds 4.5:1 over pure black and pure white in every mode and scheme (ADR 0320 decision 4); `thin` carries none.
Muted text holds it only on `thick`, so it never sits on `regular` or `thin`.
Never put the material behind a component sample; samples sit on `background`.

## Generated stylesheets

`assets/public/themes/stackra/{web,native}.css` are the renderers' output for `STACKRA_THEME`, committed so apps can
`@import` them. The renderer tests compare each file with its output byte for byte. After changing the theme or a
renderer, regenerate both:

```sh
pnpm --filter @stackra/tokens exec vitest run -u
```

## The stackra theme

The oklch values come unchanged from the approved Stackra brand kit 0.1.0, which `@stackra/brand` vendored until ADR 0302
retired it. The kit's token reports sit in `assets/data/stackra/` (`resolved`, `contrast`, `separation` and their
sources); the tests hold the theme to them: the resolved colours, every WCAG minimum in the contrast report, and an
achromatic accent family. Every hex is derived from its oklch value; the kit's own hex labels for the HeroUI base roles
(surfaces, status colours, borders) did not match their oklch and are not used. The contrast report was computed from
the oklch values, so it holds. Stackra has **no accent colour**: every accent role is a neutral (ink on paper, paper on
ink). Steel colours the wordmark and the st tile only. The kit predates HeroUI's `segment` role, so the theme aliases it
to white in light and graphite-700 in dark.

One documented deviation from the kit: the light `--muted` (and so `--field-placeholder`) is `oklch(0.49 0.01 250)`, not the
kit's `oklch(0.5 0.01 250)`, so muted text keeps 4.5:1 on tinted surfaces such as soft chips (owner decision 2026-10-23,
STA-403). The kit's resolved and contrast reports carry the new value and ratios, recomputed with `oklchToHex` and
`contrastRatio`.

The logos, marks, icons and other brand assets moved to the docs app (`apps/docs/src/assets/brand/`), all rights
reserved under their `NOTICE` (ADR 0024). The fonts keep their SIL Open Font License, whose texts sit beside them.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/tokens`.
