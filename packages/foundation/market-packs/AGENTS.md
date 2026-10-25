# AGENTS — @stackra/market-packs

The market-pack loader. Member at `packages/foundation/market-packs` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entry `.` only. Decision record: ADR 0370.

## Where code goes

| You are writing…                       | It goes in…                                   |
| -------------------------------------- | --------------------------------------------- |
| An enum                                | `src/core/enums/<name>.enum.ts` (`Enum.of`)   |
| A refusal                              | `src/core/errors/<name>.error.ts` (`Refusal`) |
| A function (public or internal helper) | `src/core/functions/<name>.function.ts`       |
| A schema or constant                   | `src/core/constants/<name>.constant.ts`       |
| A type                                 | `src/core/types/<name>.type.ts`               |
| A test                                 | `__tests__/<name>.<kind>.test.ts` beside it   |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`. `canonicalJson`, `compareVersions`, `pickPack` and
  `packLabel` stay internal.

## This package

- **No pack content in code.** No market code, rate, period, provider, law or floor value is written here; packs are
  data owned by the platform (base packs) and by products (their sections). Tests use made-up markets (`xa`, `xa-one`).
- Trusted public keys are deployment configuration; the private signing key is held by the caller of `signPack`
  and never read, stored or logged here.
- The content hash covers the pack exactly as shipped (canonical JSON); never hash a parsed copy in `verifyPack`.
- A section's keys carry its prefix, so a product can never overwrite a base value.
- Runtime dependencies are `@stackra/contracts`, `@stackra/errors` and `zod`; crypto is Web Crypto.
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
