<!--
Stackra file contract:
Purpose: the agent rules of @stackra/branding: where code goes, entries, the package's invariants, PII.
Boundary: documentation only; the user-facing guide is README.md.
Runtime: none (Markdown)
Governing contract: ADR 0294, ADR 0305; ADR 0222; ADR 0307; STA-2644.
-->

# AGENTS — @stackra/branding

A tenant's brand profile every surface reads: one settings group, one media bucket, one reader. Member at
`packages/design-system/branding` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`.

## Where code goes

| You are writing…                                        | It goes in…                                         |
| ------------------------------------------------------- | --------------------------------------------------- |
| A type surfaces code against                            | `src/contracts/types/`                              |
| The settings group, its section, a refusal, pure maths  | `src/core/` (`branding.settings.ts`, `schemas/`, `errors/`, `functions/`) |
| The bucket, the reader and their constants              | `src/node/{models,services,constants}/`             |
| A label or a refusal message                            | `assets/lang/{en,ar}/branding.json`                 |
| A test                                                  | `__tests__/<name>.<kind>.test.ts` beside it         |

## Entries and barrels

- `src/{contracts,core,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `contracts` is the leaf (types only); `core` imports `contracts`; `node` imports `core`. The package has no module
  file: gen derives the `branding` module.

## This package

- Surfaces read the brand through `BrandReader#profile` only, never `SettingsReader#get(BrandingSettings)` directly, so
  the fallbacks (locale, mark to logo, on-colours) live in one place.
- No SVG, ever: `BRAND_ASSET_TYPES` is PNG and JPEG. Never add a type that can carry script.
- The contrast minimums (4.5:1 primary, 3:1 accent) live in `brandColorRefusals` and nowhere else; `BrandReader` and
  any save path call it. Never put the contrast rule in the group's read schema, and keep every format rule there
  `.catch(null)`: no stored value may make a read throw, since every tenant's documents and emails read it.
- Core names no product brand: a product's own brand is data on its tenant node, seeded by that product.
- `BRAND_ASSETS_BUCKET_KEY` is the bucket's derived key; the bucket registers under it and the reader builds paths from
  it. Change both or neither.

## Tasks

`pnpm turbo run <task> --filter=@stackra/branding`: `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data          | Where                 | Handling                                                   |
| ------------- | --------------------- | ---------------------------------------------------------- |
| Business name | `branding.displayName` | A business's public name, not a person's; shown publicly. |
