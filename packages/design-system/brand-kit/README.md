# @stackra/brand-kit

The brand generator Runway runs in CI ([ADR 0441](../../../apps/docs/src/adr/0441-product-repository-layout-assets-tree-and-root-runway-surfaces.mdx)
decision 5). It reads a product's kit at `<repo>/assets/brand` and the kit's theme, checks the kit, and writes the
generated set: tokens, HeroUI CSS, app icons and Android adaptive icons, splash screens, favicons with the web
manifest, and store-screenshot frames. The set is a build artefact: it is written to `.stackra/brand` (gitignored) and
never committed.

The package holds no brand. Colours come from the kit's theme through `@stackra/tokens`, which also renders the CSS,
so there is no colour logic here. A kit that has a parent brand (Figentra's family kits) keeps its parent's marks and
endorsement rules as its own data; this package only reads the generic fields below.

**Tier:** `tier:lib` (`packages/design-system/brand-kit`). Ported from figentra/os `tools/brand-kit` (`ORIGIN.md`).

## The command line

```sh
brand-kit generate <kit> --out <dir> [--screenshots <dir>] [--store <dir>] [--json]
brand-kit check [<kit>…] [--registry <file>]
```

| Command    | What it does                                                                                                                                                                                                             | Exit codes                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `generate` | Writes the set into `--out` (outside the kit) with an `outputs.json` index. `--screenshots` adds the store frames; `--store` is the captions tree (default: the kit's sibling `store/`). `--json` prints the run record. | 0 done, 1 a kit error, 2 usage     |
| `check`    | Checks each kit: named folders, a `--registry` file (`{ "kits": [<path>, …] }`, relative to the file) and `STACKRA_BRAND_KITS` (`:`-separated); `assets/brand` when nothing names one.                                   | 0 all pass, 1 a kit fails, 2 usage |

Runway's CI step runs `brand-kit generate <repo>/assets/brand --out .stackra/brand --json` through its
`BrandKitGeneratorDriver` (`@stackra/runway/node`).

## The kit (`assets/brand/kit.json`)

```json
{
  "id": "acme",
  "name": { "en": "Acme", "ar": "أكمي" },
  "theme": "theme.json",
  "symbol": "marks/symbol.svg"
}
```

| Field                 | Required | Meaning                                                                                                                     | Default                                                                      |
| --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`                  | yes      | the product key, lower-case kebab                                                                                           |                                                                              |
| `name`                | yes      | the name per locale; `en` required                                                                                          |                                                                              |
| `shortName`           |          | the home-screen name                                                                                                        | `name.en`                                                                    |
| `theme`               | yes      | a theme file: a full `stackra.theme/1` export, a `stackra.theme-diff/2` over the stackra theme, or a bare theme             |                                                                              |
| `symbol`              | yes      | the square symbol SVG, painted with `currentColor`, no `<text>`, no active content                                          |                                                                              |
| `icon`                |          | `background` and `foreground` roles, `scale` (symbol share), `radius` (web tiles), `sizes`                                  | `accent`, `accent-foreground`, 0.58, 0.21875, `[1024]`                       |
| `splash`              |          | `background` and `foreground` roles, `scale`, `size`                                                                        | `background`, `accent`, 0.6, 1024                                            |
| `manifest`            |          | `display`, `startUrl`                                                                                                       | `standalone`, `/`                                                            |
| `store`               |          | `background` and `foreground` roles, `captionSize` (share of width), `frames` (`id`, `width`, `height`), `fonts` per locale | `accent`, `accent-foreground`, 0.06, 6.9-inch iOS and an Android phone, none |
| `check.requiredFiles` |          | files every kit holds                                                                                                       | `kit.json`, `README.md`                                                      |
| `check.requiredMarks` |          | mark names some SVG under `logos/` or `marks/` starts with (an endorsement mark, for example)                               | none                                                                         |

Colours are always theme roles (`ColorRole` of `@stackra/tokens`), never values. Any other top-level field is the
kit owner's data and is ignored. `KIT_DEFAULTS` holds every default; `BRAND_KIT_SCHEMA` is the schema.

## What `check` enforces

- the required files, the theme and the symbol exist;
- at least one logo SVG under a `logos/` or `marks/` folder, and one starting with each `check.requiredMarks` name;
- **no live `<text>` in any logo SVG** (directions and versions included) or in the symbol: outline it with
  `outlineText`;
- the symbol has a square `viewBox` and no script, `foreignObject` or `on*` handler;
- `versions.json`, when present: unique ids, statuses from `KitStatus`, a retired version's earlier `name.en`, every
  `dir` present, and no `dir` on the default version (it lives at the kit root).

## What `generate` writes

| Path                                                        | What                                                                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens/theme.json`, `tokens/tokens.dtcg.json`              | the resolved theme as a full export and as DTCG tokens                                                                                         |
| `heroui/web.css`, `heroui/native.css`                       | HeroUI v3 web and HeroUI Native / Uniwind CSS (`@stackra/tokens`)                                                                              |
| `icons/app-icon-<size>.png`                                 | full-bleed app icons; the stores mask them                                                                                                     |
| `android/adaptive-{foreground,background,monochrome}.png`   | adaptive icon layers, the symbol inside the visible 72 of 108 dp                                                                               |
| `splash/splash-icon.{light,dark}.png`, `splash/splash.json` | the splash images and their background colours per mode                                                                                        |
| `favicon/`                                                  | `favicon.svg`, `favicon.ico` (16, 32, 48), `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest` |
| `store/<app>/<locale>/<frame>/<name>.png`                   | with `--screenshots`: each captured screen framed, its caption from `<store>/<app>/<locale>/captions.json` outlined in `store.fonts`           |
| `outputs.json`                                              | the run record: kit id, output folder, every file                                                                                              |

The output is deterministic: no browser, no system font (captions are outlined with opentype.js from the kit's font
files), PNGs rendered by resvg's WebAssembly.

## Entry points

| Import                         | Holds                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/brand-kit`           | `parseKit`, `checkKit`, `planBrand` and its parts, `validateJsonSchema`, `KIT_DEFAULTS`, `BRAND_KIT_SCHEMA`, `InvalidKitError`; pure  |
| `@stackra/brand-kit/contracts` | `BrandKit`, `BrandOutput`, `GenerateResult`, `LocatedKit`, `TextOutline`, `KitStatus`                                                 |
| `@stackra/brand-kit/node`      | `generateBrand`, `readKit`, `findKits`, `checkKitFolder`, `outlineText`, `loadFont`, `rasterizeSvg`, `planStoreFrames`, `runBrandKit` |
| `brand-kit` (bin)              | the command line above                                                                                                                |

Entry barrels are stand-ins until `stackra gen` writes them (STA-339).

## Not here yet

- 0340 decision 10's determinism check across two runs and its literal scan run as tests, not as `check` rows.
- A repository check that refuses generated files committed beside the kit (ADR 0441 enforcement) is planned; today
  `generate` only refuses an output folder inside the kit.
- Captions are one line, shrunk to fit; no wrapping.

## Tasks

`pnpm turbo run <task> --filter=@stackra/brand-kit`: `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.
