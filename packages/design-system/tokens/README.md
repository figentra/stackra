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

| Import                      | Holds                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/tokens`           | `STACKRA_THEME`, `defineTheme`, `renderWebCss`, `renderNativeCss`, `oklchToHex`, `contrastRatio`, `InvalidThemeError`, `TokensConfig` |
| `@stackra/tokens/contracts` | the schema: `Theme`, `ColorToken`, `ThemeColors`, `ColorRole` (the role list), and the part types                                     |
| `@stackra/tokens/node`      | `TokensModule`, the root module                                                                                                       |
| `@stackra/tokens/themes/*`  | `assets/public/themes/`: `stackra/web.css`, `stackra/native.css`                                                                      |
| `@stackra/tokens/fonts/*`   | `assets/public/fonts/`: Geist, Geist Mono, IBM Plex Sans Arabic (woff2), `fonts.css`, the OFL texts                                   |
| `@stackra/tokens/assets/*`  | any file under `assets/`                                                                                                              |

`.` and `./contracts` name stand-in barrels (`src/core/index.ts`, `src/contracts/index.ts`) until `stackra gen` writes
the entry barrels (STA-339). `exports` point at source through the `@stackra/source` condition; `tsdown` builds `dist/`
for publishing (ADR 0025).

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
