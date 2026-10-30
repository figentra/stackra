<!-- Purpose: the agent guide to @stackra/privacy: where each kind of code goes, the entry rules and the invariants an edit must keep. Boundary: this package only. Runtime: none. Governing contract: ADR 0189, ADR 0212, ADR 0134, ADR 0294, STA-1375. -->

# AGENTS — @stackra/privacy

The `PersonalData` kind, the DSAR export job and the erasure saga (ADR 0189 decisions 1, 2 and 4; ADR 0212
crypto-shredding). Member at `packages/security/privacy` (`tier:lib`), in the programming model v3.1 shape (ADR 0294,
0305). Entries `.`, `./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                               | It goes in…                                               |
| ---------------------------------------------- | --------------------------------------------------------- |
| A port, an enum or a type the ports exchange   | `src/contracts/{ports,enums,types}/`                      |
| The configuration and its shape                | `src/config/`, `src/core/schemas/`, `src/core/constants/` |
| The kind base, its registry                    | `src/core/{bases,functions,constants}/`                   |
| An isomorphic driver, service or event         | `src/core/{drivers,services,events}/`                     |
| A job, the saga, a server driver, schemas      | `src/node/{actions,workflows,drivers,schemas}/`           |
| A job's permissions (`<model>.permissions.ts`) | `src/node/access/`                                        |
| A listener of the erasure's events             | `src/node/listeners/`                                     |
| A function over @stackra/model's registry      | `src/node/functions/`                                     |
| A migration of `privacy.*`                     | `src/node/database/migrations/<nnnn>-<name>.migration.ts` |
| A fake or a test helper                        | `src/testing/`                                            |
| A test                                         | `__tests__/<name>.test.ts` beside it                      |

## Entries and barrels

- `src/{contracts,core,node,testing}/index.ts` are stand-in barrels until gen writes them (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts` (exact sets).
- `contracts` is the leaf; `core` imports `contracts`; `node` imports both; `testing` imports them all.
- `KeptRecords`, `ServiceAcked` and `Workflow` are `@stackra/workflow`'s; `HoldRegistry`, `Disposal` and `Where` are
  `@stackra/database/contracts`'; `FileSystem` is `@stackra/filesystem/contracts`'. Import them, never re-export them.

## This package

- A declaration is data. Never add an exporter or eraser method to `PersonalData`; a new behaviour is a new
  `ErasureMethod` (update the exact-set test, the README and both schemas that list the methods).
- Every disposal asks `disposableIds` first; held rows are kept and counted, never touched.
- Never shred while a held row carries a `shred` field.
- Legal holds (`legal_holds`): a release keeps the row; never delete a hold or a refusal row. A hold is never an
  agent tool, and every statement names the session's tenant partition as well as the policy enforcing it.
- Never erase while a `shred` field is not subject-sealed (`unsealedShredFields`); the receipt would be false.
- @stackra/model is imported from `node` only (its runtime is node); `core` and `contracts` stay off it.
- A salt never leaves `SubjectKeyProviderDriver`: never log, export or put it in an event.
- Erasure reaches every copy: the outbox through the saga's `redact` step (`redactSubjectMessages` of
  @stackra/outbox), search through `UnindexErasedSubjectListener`. A new copy kind adds a step or a listener here.
  @stackra/search and @stackra/outbox never import this package (search is already below it through
  workflow, rules and ai, so the reverse edge would close a cycle).
- Receipts and events carry counts and kinds, never row ids or contents. A shape field is typed with a shape class
  (`ErasedRecordsLine`), never a contracts interface, or gen refuses it (`shape_unknown_type`).
- Every action key needs its permission in a `Permissions` class under `src/node/access/` (`permission_unknown`).
- Event names are `<aggregate>.<verb>` (`subject.erased`); gen adds the module key.
- Business values (export window, folder) are `PrivacyConfig`, never constants.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.
- No `tenant` identifiers (R-59); the running scope comes from row-level security.
- `SubjectHolds` (`./contracts`, STA-1567) asks only whether a live hold names a subject's public id, in the session's
  partition (`PostgresSubjectHoldsDriver`), never across tenants: the caller runs per scope, as the erasure does.

- `test:int` (`vitest.int.config.ts`, which wraps `vitest.config.ts` in `intTier` from `@stackra/vitest-config/int`)
  runs the `.int.test.ts` files on a Testcontainers Postgres and needs Docker; `test` never runs them (STA-1570).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                        | Where                                 | Handling                                                                     |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| A subject's declared fields | DSAR zips on the host disk            | random file name; signed link for `exportTtlDays`; purged nightly after that |
| Subject public id           | `EraseSubjectInput`, receipts, events | pseudonymous id only, kept as the proof the request was honoured             |
| Subject salt                | `privacy.subject_salts` or the host's | read only to derive the subject key; destroyed on erasure; never logged      |

- `personalDataDeclarations` drops every field a model classifies `credential` and any declaration left empty: a provider secret is never in a DSAR export and erasure skips it (ADR 0494).
