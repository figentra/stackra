# AGENTS — @stackra/brand-kit

The generic brand generator. Member at `packages/developer/brand-kit` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `./contracts` and `.`. ADR 0441 (as amended).

## Where code goes

| You are writing…                     | It goes in…                                 |
| ------------------------------------ | ------------------------------------------- |
| An enum (`BrandOutput`)              | `src/contracts/enums/<name>.enum.ts`        |
| A type (`BrandKit`, `AssetManifest`) | `src/contracts/types/<name>.type.ts`        |
| A generator or function              | `src/core/functions/<name>.function.ts`     |
| A test                               | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/contracts/index.ts` and `src/core/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339).
- `contracts` is a leaf; `core` imports it through `#contracts/*`. No symbol is exported from both.

## This package

- Generic only: never import `@figentra/*` or `figentra/os` code. The parent kit and its endorsement marks are data
  passed in (`BrandKitOptions.parentKitDir`).
- Output is deterministic: the same kit gives the same bytes, so `--check` can compare hashes.
- Generated files are never committed; the asset manifest lists them for that check.
- New third-party dependencies (font outlining, image encoding) are catalog entries.

## Still missing (skeleton)

`CHANGELOG.md`, `LICENSE` and the runway member file come with stackra-12 (STA-957), with the generator. Root
`runway.yaml`, the category README and the catalogue row are integration asks (stackra-90).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- No TypeScript `enum` (use `Enum.of`), no `#private` fields, no parameter properties.
