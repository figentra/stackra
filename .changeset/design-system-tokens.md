---
"@stackra/tokens": minor
---

New package, part of the Stackra Design System (ADR 0302). It holds the theme schema (`Theme`, `ColorToken` and the
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
