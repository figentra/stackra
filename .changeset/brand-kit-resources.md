---
"@stackra/brand": minor
---

The package now carries the whole Stackra brand kit under `resources/` (exported as `./resources/*`): the HeroUI v3
web theme and the HeroUI Native / Uniwind theme, `fonts/fonts.css` with the woff2 faces and their OFL texts, logos,
the "by figentra\_" marks, app icons, favicons, splash marks, UI icons, patterns, illustrations, the kit's token
sources, and email templates kept for later. `./tokens.css` now resolves to `resources/heroui/web.css` (same
properties); `./logos` and `./fonts` move from `src/` to `resources/`. The brand assets stay all rights reserved
(`resources/NOTICE`).
