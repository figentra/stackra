# AGENTS — @stackra/registry

Module catalogue validation for a registry service. Member at `packages/application/registry` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…                 | It goes in…                                 |
| -------------------------------- | ------------------------------------------- |
| A shape (`CatalogueManifest`)    | `src/core/schemas/<name>.schema.ts`         |
| Its shipped schema or a constant | `src/core/constants/<name>.constant.ts`     |
| An enum                          | `src/core/enums/<name>.enum.ts`             |
| A function                       | `src/core/functions/<name>.function.ts`     |
| A type                           | `src/core/types/<name>.type.ts`             |
| A test                           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.

## This package

- Runtime dependencies are `@stackra/contracts`, `@stackra/validation` and `zod` only.
- `CatalogueManifest` names the catalogue fields a registry reads (module `enhances`, `intents`, `entitlement`; action
  `tool`, `toolOff`; event `webhook`, `dataClasses`, `thinFields`). A new one goes in both the shipped schema and the
  class, optional, so older manifests still pass.
- `deliverableEvents` is the only place that turns `webhook` and `dataClasses` into a payload shape; any personal-data
  class makes it thin.
- `validateCatalogue`, `canTransitionReview`, `planEditionInstall` and `deliverableEvents` are pure and never throw on untrusted input. Any new check keeps the output independent of input
  order: walk manifests in the sorted order, and compare strings by code unit, never with `localeCompare`.
- A new diagnostic code is a new case of `CatalogueDiagnosticCode`, snake_case.
- Configuration, not code: fee rates, sandbox counts and lifetimes, and review rules are records and settings the
  service passes in; only the transitions, the arithmetic and the install order live here.
- Only add a symbol a consumer imports today (the template, a package, or the registry row).
- A `perk` listing never installs (ADR 0393): it is redeemed by code, link or lead. The offer rule sets in
  `assets/data/rule-sets/` are seeds in the `@stackra/rules` `RuleSetPack$` shape; this package never imports
  `@stackra/rules`, and the incubator list is the editable `settings:os:startup-incubators` record.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties, no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/registry` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data | Where                                                                                              | Handling                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Ids  | `AppReview.reviewer`, `DeveloperSandbox.developer`, `PartnerPayout.partner`, `PerkListing.partner` | Principal and organisation public ids only; nothing stored here.                                                |
| Lead | `redeemPerk` (a lead perk's `lead`)                                                                | Only the listing's named fields, only after the admin's consent; returned, never stored or logged here (US-62). |
