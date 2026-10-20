---
"@stackra/brand": minor
---

The package now carries the whole Stackra brand kit under `assets/` (exported as `./assets/*`): the HeroUI v3 web
theme and the HeroUI Native / Uniwind theme in `assets/heroui/`, the kit's token sources in `assets/tokens/`; fonts
(woff2, `fonts.css`, OFL texts), logos, the "by figentra\_" marks, app icons, favicons, splash marks, UI icons,
patterns and illustrations in `assets/public/`; and email templates kept for later in `assets/templates/email/`.
`./tokens.css` now resolves to `assets/heroui/web.css` (same properties); `./logos` and `./fonts` move from `src/` to
`assets/public/`. The brand assets stay all rights reserved (`assets/NOTICE`).
