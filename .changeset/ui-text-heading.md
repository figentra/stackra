---
"@stackra/ui": minor
"@stackra/tokens": minor
---

`@stackra/ui` adds `Text` and `Heading` to `./react` (HeroUI v3 Typography) and `./native` (HeroUI Native Typography),
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
