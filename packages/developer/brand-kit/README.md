# @stackra/brand-kit

The generic brand generator Runway runs in CI
(ADR 0441 as amended in stackra-01). It reads `<repo>/assets/brand/kit.json` and writes design
tokens (through `@stackra/tokens`), HeroUI CSS, app and adaptive icons, splash screens, favicons, the web manifest
and store-screenshot frames. `--check` rebuilds deterministically, runs the kit file checklist and compares against an
asset manifest of every generated file; generated files are never committed.

It depends on no Figentra code: Figentra's parent kit, marks and endorsement rules stay in
`figentra/os/tools/brand-kit` and plug in as data.

**Status:** skeleton. The `./contracts` entry is declared (STA-1215); the generator is stackra-12 (STA-957).

**Tier:** `tier:lib` (`packages/developer/brand-kit`).

## Entry points

| Import                         | Holds                      | Exports                                                                                                                                                                                         |
| ------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/brand-kit/contracts` | `src/contracts/`: the leaf | `BrandOutput`, `Endorsement`, `KitStatus`; types `BrandKit`, `BrandKitParent`, `LocalizedText`, `BrandKitOptions`, `AssetManifest`, `AssetManifestEntry`, `BrandCheckIssue`, `BrandCheckResult` |
| `@stackra/brand-kit`           | `src/core/`: the generator | nothing yet                                                                                                                                                                                     |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339), each
`index.ts` is a stand-in barrel.
