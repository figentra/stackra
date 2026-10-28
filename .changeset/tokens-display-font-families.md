---
"@stackra/tokens": minor
---

`FontFamilies` gains the optional `display` and `displayArabic` stacks, which default to `sans` and `arabic` and render
as `--font-display` and `--font-display-arabic`. The stackra theme sets its display and `h1` to `h6` styles (and their
Arabic twins) in them, so HeroUI's headings follow a brand's display faces; the native stylesheet registers both faces
in `@theme`. `parseThemeJson` reads a brand theme.json's §33 font keys, with `sansArabic` as an alias of `arabic`
(`TOKEN_PATH_ALIASES`); a key left out keeps the base's stack. New exports: `fontStackOf`, `FONT_FAMILY_VARIABLES`.
A text style's `family` may now be `display` or `displayArabic`, so reading `theme.fontFamily[style.family]` can be
`undefined`: use `fontStackOf` (STA-1386).
