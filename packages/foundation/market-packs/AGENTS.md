# AGENTS — @stackra/market-packs

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/market-packs: where code goes, entries and barrels, the package rules (no pack
         content in code, floors, resolving without a base pack) and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0305; ADR 0370; ADR 0385; ADR 0417; ADR 0418; ADR 0455.
-->

The market-pack loader. Member at `packages/foundation/market-packs` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entries `.` and `./node` (the root module). Decision records: ADR 0370, 0385, 0417, 0418, 0455.

## Where code goes

| You are writing…                       | It goes in…                                   |
| -------------------------------------- | --------------------------------------------- |
| An enum                                | `src/core/enums/<name>.enum.ts` (`Enum.of`)   |
| A refusal                              | `src/core/errors/<name>.error.ts` (`Refusal`) |
| A function (public or internal helper) | `src/core/functions/<name>.function.ts`       |
| A port                                 | `src/core/ports/<name>.port.ts`               |
| A driver                               | `src/core/drivers/<name>.driver.ts`           |
| A value built with `create`            | `src/core/values/<name>.value.ts`             |
| A draft seed pack (data, not code)     | `assets/data/packs/<market>.json`             |
| A schema or constant                   | `src/core/constants/<name>.constant.ts`       |
| A type                                 | `src/core/types/<name>.type.ts`               |
| A shape class (config options)         | `src/core/schemas/<name>.schema.ts`           |
| The configuration                      | `src/config/market-packs.config.ts`           |
| The root module                        | `src/node/market-packs.module.ts`             |
| A test                                 | `__tests__/<name>.<kind>.test.ts` beside it   |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`. `canonicalJson`, `compareVersions`, `packLabel` and
  `subjectOf` stay internal; `pickPack` is public (ADR 0455).

## This package

- **No pack content in code.** No market code, rate, period, provider, law or floor value is written in `src/`; packs are
  data owned by the platform (base packs) and by products (their sections). Unit tests use made-up markets (`xa`,
  `xa-one`). The only pack content here is the draft seed data in `assets/data/packs/` (the `us` base and seven state
  overlays, ADR 0385, with the ADR 0405 formats, the ADR 0392 billing terms and the optional cash rounding), checked
  by `src/core/__tests__/us-packs.test.ts`, and the `sa`, `ae` and `eg` identity packs, checked by
  `src/core/__tests__/mena-packs.test.ts`; it stays `draft` until a reviewer signs it.
- **Subjects.** Which market answers a rule kind (`location`, `buyer`, `entity`, `tenant`) is pack data
  (`subjects`); `MarketContext.packFor` reads it. Never branch on a rule kind in code.
- **Storage.** Signed packs are stored and fetched by content hash through `PackStore`; the production driver uses
  the `FileSystem` port of `@stackra/filesystem`, and shipped data assets are read through `AssetLibrary` of
  `@stackra/assets`. Use both through their public entries only.
- **Serving.** A service injects `ResolvedPackSource` (exported by `MarketPacksModule`); the `store` driver fetches the
  hashes in `MarketPacksConfig` from `PackStore` and verifies them, the `memory` driver serves packs handed to it
  with `use(packs)` (built with no arguments, as gen wires class tokens only). The OS
  loader is a further driver or a host `@Replaces`.
- **Publish check.** `PackSchemaRegistry` holds the section schemas (JSON Schema per key, registered as data by their
  owners) and `overlayFloorIssues` refuses an overlay that loosens a parent floor. Both return issues, never throw. A
  `*` segment in a declared key declares a family whose last part is data (`providers.*`); it is never required.
- **Base schemas.** `BASE_PACK_SCHEMAS` declares the base keys Stackra packages and OS services read but no OS section
  owns yet (`notifications.channels.*`, `notifications.prayer_holds`, `providers.*`, `imports.legacy_encoding`,
  `identity.national_ids`, `identity.address_format`, `ai.approval_floor`). An identity shape is the JSON Schema of
  its @stackra/validation `X$`; never copy it by hand. Keep
  each prefix as narrow as its keys; add a key here only when a consumer reads it, and never a market's value.
- **Floors.** `FloorBound` is `min`, `max` or `list` (ADR 0455). Every comparison of a bound (here
  `overlayFloorIssues`, in rules `crossedFloor`, in settings `crossesFloor`) handles all three; adding a bound means
  changing all of them.
- **No base pack.** `resolvePack` refuses a market without a base pack unless the caller passes `requireBase: false`;
  then a market without one nests under its code's parent. Never make that the default.
- Trusted public keys are deployment configuration; the private signing key is held by the caller of `signPack`
  and never read, stored or logged here.
- The content hash covers the pack exactly as shipped (canonical JSON); never hash a parsed copy in `verifyPack`.
- A section's keys carry its prefix, so a product can never overwrite a base value.
- Runtime dependencies are `@stackra/assets`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`,
  `@stackra/errors`, `@stackra/filesystem`, `@stackra/validation` and `zod`; crypto is Web Crypto.
- Only add a symbol a consumer imports today (the market-pack loader row in `notes/handover/stackra-package-needs.md`).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/market-packs` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

None. Packs hold market rules; reviewer and checklist names are staff identifiers chosen by the pack author.
