<!--
Stackra file contract:
Purpose: agent rules for @stackra/brand-kit: where code goes, the entries, and what this package must never do.
Boundary: documentation only.
Runtime: none
Governing contract: ADR 0294, ADR 0305 (programming model v3.1); ADR 0441 (as amended)
-->

# AGENTS — @stackra/brand-kit

The generic brand generator. Member at `packages/developer/brand-kit` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `./contracts`, `.` and the `stackra-brand-kit` bin. ADR 0441 (as amended).

## Where code goes

| You are writing…                            | It goes in…                                                |
| ------------------------------------------- | ---------------------------------------------------------- |
| An enum (`BrandOutput`)                     | `src/contracts/enums/<name>.enum.ts`                       |
| A public type (`BrandKit`, `AssetManifest`) | `src/contracts/types/<name>.type.ts`                       |
| An internal type (`DeviceFrame`)            | `src/core/types/<name>.type.ts`                            |
| A size, path or frame table                 | `src/core/constants/<name>.constant.ts`                    |
| A generator or function                     | `src/core/functions/<name>.function.ts`                    |
| The binary                                  | `src/node/brand-kit.ts` (the only side effect)             |
| A test or fixture                           | `__tests__/<name>.test.ts` / `<name>.fixture.ts` beside it |

## Entries and barrels

- `src/contracts/index.ts` and `src/core/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339).
- `contracts` is a leaf; `core` imports it through `#contracts/*`. No symbol is exported from both.

## This package

- Generic only: never import `@figentra/*` or `figentra/os` code. A parent kit is a folder of data
  (`parentKitDir`): its theme and its endorsement mark files.
- One output kind, one generator: `generate-<kind>.function.ts`, registered in `generate-brand.function.ts`. A
  generator is a pure function of `KitInput` and the `SvgRenderer` port; only `run-brand-kit.function.ts` writes, and
  only under `outDir`.
- Output is deterministic: the same kit gives the same bytes. Sort every list; never read the clock, the locale or
  system fonts.
- Sizes, paths and device frames are data in `src/core/constants/`; a store or platform change edits a table, not a
  generator.
- Generated files are never committed; the asset manifest lists them for that check (stackra-13).
- New third-party dependencies (font measuring, image encoding) are catalog entries, handed to the integration batch.

## Not here

- The Runway brand step, the never-committed repository check and the screenshot capture lane: stackra-13.
- Root `runway.yaml` placement, the category README row and the catalogue row: integration (stackra-90). The member
  has no `runway.yaml`: it needs no runtime resource (ADR 0296 decision 1).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- No TypeScript `enum` (use `Enum.of`), no `#private` fields, no parameter properties.
- One declaration per file.

## PII

None. The brand kit reads a kit's brand data (names, lines, logo marks, theme tokens), store captions and store
screenshots, and writes generated assets and their manifest; it handles no personal data and no secret value.
