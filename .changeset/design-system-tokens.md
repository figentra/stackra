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
