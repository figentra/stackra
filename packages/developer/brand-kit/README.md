<!--
Stackra file contract:
Purpose: the reader's guide to @stackra/brand-kit: what it generates from a product's kit, how to run it and --check,
         and its entries.
Boundary: documentation only; the code is the source of truth for sizes and paths (src/core/constants).
Runtime: none
Governing contract: ADR 0441 (as amended: D17, D18, D19); ADR 0340 (decisions 10, 11)
-->

# @stackra/brand-kit

The generic brand generator Runway runs in CI (ADR 0441 as amended in stackra-01). It reads
`<repo>/assets/brand/kit.json` and writes design tokens (through `@stackra/tokens`), HeroUI CSS, app and adaptive
icons, splash screens, favicons, the web manifest and store-screenshot frames with captions from `assets/store`.
`--check` writes nothing: it runs the kit file checklist, builds twice to prove the output is deterministic, and
compares a fresh build with the asset manifest already in the output folder. Generated files are never committed;
the asset manifest lists every one of them for the never-committed check (stackra-13).

It depends on no Figentra code (only `@stackra/contracts`, `@stackra/support` for `escapeXml` and `@stackra/tokens`). A parent kit (for Figentra products, `figentra/os/tools/brand-kit/figentra`) is a
folder of data passed as `--parent-kit-dir`: its `tokens/theme.json` sits under the kit's theme, and its endorsement
mark is a file the checklist looks for (`<by|powered-by>-<parent>*.svg` under `logos/` or `marks/`).

**Tier:** `tier:lib` (`packages/developer/brand-kit`).

## Run it

```sh
stackra-brand-kit                       # build every output into .stackra/brand/ and write asset-manifest.json
stackra-brand-kit --check               # checklist, determinism and drift; exit 1 on any issue
stackra-brand-kit --outputs tokens,heroui_css --parent-kit-dir ../os/tools/brand-kit/figentra
```

| Flag                | Default                | What                                                 |
| ------------------- | ---------------------- | ---------------------------------------------------- |
| `--root`            | the current directory  | repository root                                      |
| `--kit-dir`         | `assets/brand`         | the kit folder                                       |
| `--out-dir`         | `.stackra/brand`       | where outputs go; never committed                    |
| `--store-dir`       | `assets/store`         | `<app>/<locale>/captions.json`                       |
| `--screenshots-dir` | `.stackra/screenshots` | `<app>/<locale>/<screen>.png` the capture job leaves |
| `--parent-kit-dir`  | none                   | a parent kit's folder, read as data                  |
| `--outputs`         | every `BrandOutput`    | comma-separated codes                                |
| `--check`           | off                    | write nothing; report issues                         |

From code (Runway's brand step): `await runBrandKit({ root, check: true })` returns a `BrandCheckResult`.

## What a kit holds

| Kit path                                              | Read by                                         |
| ----------------------------------------------------- | ----------------------------------------------- |
| `kit.json`                                            | everything (`BrandKit`, checked)                |
| `README.md`, `versions.json`                          | the checklist                                   |
| `seed.json`                                           | the checklist, when `kit.json` has `seed: true` |
| `tokens/theme.json`                                   | tokens, HeroUI CSS and every colour             |
| `logos/app-icon/app-icon-{light,dark}.svg`            | app icons, Apple touch icon, web icons          |
| `logos/app-icon/adaptive-{foreground,monochrome}.svg` | Android adaptive icon                           |
| `logos/favicon/favicon.svg`                           | favicons                                        |
| `logos/splash/splash-{light,dark}.svg`                | splash screens                                  |
| `fonts/*.ttf`, `fonts/*.otf`                          | caption type in store frames                    |

Dark and monochrome sources are optional and fall back to their light ones. Sizes, paths and device frames are the
tables in `src/core/constants/`. Store frames: `ios_phone` 1290x2796 (6.9"), `ios_tablet` 2048x2732 (13"),
`android_phone` 1080x1920, `android_tablet_7` 1200x1920 and `android_tablet_10` 1600x2560; Google Play refuses a side
outside 320 to 3840 px or a long side over twice the short one, which a test keeps true.

## Entry points

| Import                         | Holds                      | Exports                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@stackra/brand-kit/contracts` | `src/contracts/`: the leaf | `BrandOutput`, `Endorsement`, `KitStatus`; types `BrandKit`, `BrandKitParent` (names are `@stackra/contracts` `LocalizedText`, English required), `BrandKitOptions`, `BrandKitRunOptions`, `KitInput`, `GeneratedFile`, `StoreCaption`, `StoreCaptionSet`, `SvgRenderer`, `AssetManifest`, `AssetManifestEntry`, `BrandCheckIssue`, `BrandCheckResult` |
| `@stackra/brand-kit`           | `src/core/`: the generator | `runBrandKit`, `readKit`, `generateBrand`, `missingSources`, `checkKitFiles`, `assetManifestOf`, `createResvgRenderer`, `parseBrandKitArgs`, `validateKitJson`, `storeFrameSvg`, `encodeIco`, `InvalidBrandKitError`; data `BRAND_DEFAULTS`, `BRAND_SIZES`, `DEVICE_FRAMES`, `KIT_SOURCES`, `OUTPUT_SOURCES`                                           |
| bin `stackra-brand-kit`        | `src/node/brand-kit.ts`    | the command line                                                                                                                                                                                                                                                                                                                                       |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339), each
`index.ts` is a stand-in barrel.

## Limits

- Captions wrap by character count, not measured glyph width; a very long caption may overflow its frame.
- The web manifest is English only.
- Rasterising is resvg (WebAssembly, the catalog's `@resvg/resvg-wasm`), with the kit's fonts and no system fonts.
