---
"@stackra/brand-kit": minor
"@stackra/runway": minor
---

New package `@stackra/brand-kit` (ADR 0441 decision 5): the generic brand generator. It reads a product's
`assets/brand/kit.json` and the kit's theme, checks the kit (required files and marks, no live `<text>` in a logo, a
usable symbol, `versions.json`), and writes tokens, HeroUI web and native CSS (through `@stackra/tokens`), app icons,
Android adaptive icons, splash screens, favicons with the web manifest, and captioned store-screenshot frames. The
`brand-kit` binary runs `generate` and `check`. `@stackra/runway` gains the brand step: `brandGenerateRequest`,
`generateBrandSet` over the `BrandGenerator` port, and `BrandKitGeneratorDriver` in `./node`, which runs
`brand-kit generate <assets root>/brand --out .stackra/brand`; the generated set is never committed.
