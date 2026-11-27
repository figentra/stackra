# Implementation Plan: stackra new adds the pieces of a feature (module, model, migration, action, query)

**Spec**: `.agents/specs/sta-2855-new-feature-generators/spec.md` · **Linear**: STA-2855 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2855-new-feature-generators/spec.md`

## Summary

`stackra new` gains five feature kinds, dispatched before the member kinds to `scaffoldFeature`
(`src/node/feature-scaffold/`). It finds the service (`--member`, else the nearest `stackra.config.ts` that calls
`defineService`), derives every name the way gen does (gen's own `tableName` and prefix registry), renders the files from
pure builders (model, migration, action, query), extends the model's Permissions class, the model or package.json where
the piece needs it, refuses before writing anything, and formats what it wrote with the workspace's oxfmt.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/cli`; docs in `apps/docs`
- **Testing**: vitest in `src/**/__tests__/`; one test runs gen strict over a fixture service built only with the new kinds
- **Storage**: none
- **Runtime target**: the developer's machine and CI (`stackra new`)

## Design

| Piece                                 | File                                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Kinds, field types                    | `constants/feature-kinds.constant.ts`, `field-types`                                                                        |
| Orchestration, refusals, deps, format | `functions/scaffold-feature.function.ts`                                                                                    |
| Service lookup                        | `functions/resolve-member.function.ts`                                                                                      |
| Names as gen derives them             | `functions/model-names.function.ts` (gen's `tableName`)                                                                     |
| Prefix                                | `functions/derive-prefix.function.ts` (gen's registry)                                                                      |
| Builders                              | `model-files`, `migration-files`, `action-files`, `query-files`                                                             |
| Reading and extending authored files  | `read-model`, `append-members`, `ensure-import`                                                                             |
| Small helpers                         | `parse-fields`, `property-lines`, `decorator-names`, `sample-value`, `singular`, `next-migration-number`, `contract-header` |

Name rules: an action or query is `<verb>-<model>`; the model is `--model`, else the longest tail of the name that
names a model of the module, singular or plural (`list-order-lines`). The key is `<snake model>.<snake verb>`; the
permission static is the camelCase verb. Decorated fields come first in every class body (ADR 0128).

## Constitution Check

| Law                                   | Result | Note                                                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI reads `@stackra/gen` core exports (`tableName`, `PUBLIC_ID_PREFIXES`)         |
| Secrets (ADR 0009)                    | PASS   | none                                                                                  |
| Security                              | PASS   | writes only inside the service; every action is at least L2 with idempotency          |
| HTTP and events                       | PASS   | routes come from gen's endpoint convention; the inputs carry the `<model>Id` it binds |
| Tenancy                               | PASS   | owned by default in a tenancy service (ADR 0239), `--global` documents the opt-out    |
| Delegation                            | PASS   | Claude builds; the CTO reads                                                          |
| Not built yet (ADR 0011)              | PASS   | everything named is built here                                                        |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/`; generated tests too                                       |
| Versions and catalogs                 | PASS   | a minor changeset for `@stackra/cli`                                                  |
| Deploy modes (ADR 0076)               | PASS   | developer tool, all modes                                                             |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                             |
| Docs and ADRs                         | PASS   | README, `cli.mdx`, `guides/scaffolding.mdx`; implements ADR 0282 decision 3           |

## Deploy modes

| Mode       | Behaviour                                                           |
| ---------- | ------------------------------------------------------------------- |
| SaaS       | a developer command; it writes source files in the developer's repo |
| On-prem    | the same                                                            |
| Air-gapped | the same; it reads only local files and gen's built-in registry     |

## Architecture overview

`stackra new <kind> <name>` hands the five feature kinds to `scaffoldFeature(options)` before the member kinds. It
checks the names and flags, finds the service around the working folder, and reads what it needs from the service: its
package.json, its modules and models, the module's Permissions classes and its next migration number. Pure builders
render the new files; small editors extend the Permissions class, the model or package.json. It refuses before writing
anything when a check fails or a file exists, writes the files and edits (or lists them on `--dry-run`), declares the
packages they import, and formats what it wrote with the workspace's oxfmt.

## Components and responsibilities

- `scaffoldFeature` (`functions/scaffold-feature.function.ts`): checks, orchestration, refusals, declared packages,
  formatting.
- `resolveMember`: the service (`--member`, else the nearest `stackra.config.ts` calling `defineService`).
- `modelNames`, `derivePrefix`, `singular`, `nextMigrationNumber`: names as gen derives them.
- `modelFiles`, `migrationFiles`, `actionFiles`, `queryFiles`: the builders, pure.
- `readModel`, `appendMembers`, `ensureImport`: reading and extending authored files.
- `parseFields`, `propertyLines`, `decoratorNames`, `sampleValue`, `contractHeader`: small helpers.
- `NEW_COMMAND` (`constants/new-command.constant.ts`): the flags and the dispatch.

## Files and folders

Every file the change adds or edits (tests and the changeset aside):

```text
apps/docs/src/docs/cli.mdx
apps/docs/src/docs/guides/scaffolding.mdx
packages/developer/cli/README.md
packages/developer/cli/src/node/constants/new-command.constant.ts
packages/developer/cli/src/node/feature-scaffold/constants/feature-kinds.constant.ts
packages/developer/cli/src/node/feature-scaffold/constants/field-types.constant.ts
packages/developer/cli/src/node/feature-scaffold/functions/action-files.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/append-members.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/contract-header.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/decorator-names.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/derive-prefix.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/ensure-import.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/migration-files.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/model-files.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/model-names.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/next-migration-number.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/parse-fields.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/property-lines.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/query-files.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/read-model.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/resolve-member.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/sample-value.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/scaffold-feature.function.ts
packages/developer/cli/src/node/feature-scaffold/functions/singular.function.ts
packages/developer/cli/src/node/feature-scaffold/types/feature-field.type.ts
packages/developer/cli/src/node/feature-scaffold/types/feature-options.type.ts
packages/developer/cli/src/node/feature-scaffold/types/feature-result.type.ts
packages/developer/cli/src/node/feature-scaffold/types/feature-field-type.type.ts
packages/developer/cli/src/node/feature-scaffold/types/model-facts.type.ts
packages/developer/cli/src/node/feature-scaffold/types/model-names.type.ts
```

The tests sit beside them in `functions/__tests__/` and `constants/__tests__/`.

## Data models and migrations

None in this repository. The command writes models and migrations into the developer's service: a create migration
with each model, and nullable add-column migrations (`--fields`, on the model's table or `--table`, snake_case).

## Contracts

- `stackra new <module|model|migration|action|query> <name> [--module <key>] [--model <name>] [--fields ...]
[--prefix <abc>] [--global] [--table <t>] [--member <path>] [--dry-run]`.
- `scaffoldFeature(options: FeatureOptions): FeatureResult`; `FeatureResult` is `{ member, created, changed,
dependencies, notes }`.
- Written code follows gen's rules: an action is `<model>.<verb>` at L2 or above with idempotency; a query reads the
  model's `read` at L0.

## Error handling

Every refusal is a `CliUsageError` (exit 2) raised before anything is written: an unknown kind, a name, `--module` or
`--model` not in kebab-case, a `--table` not in snake_case, a missing service, module or model, a module that exists, a
create, empty or NOT NULL migration, and a file that exists. A missing oxfmt is a note, not an error.

## Security and tenancy

The command writes only inside the service. An action is never below L2 and always carries idempotency; a query reads
the model's `read` at L0. In a service that runs `@stackra/tenancy` a model is tenant-owned unless `--global` says
otherwise (ADR 0239). `--table` is checked as snake_case before it reaches generated SQL. No secret and no network.

## Testing strategy

- AC-001 to AC-006, AC-008: `scaffold-feature.function.test.ts` and the helper tests in `functions/__tests__/`; the
  review conditions in "writes `read` at L0, not the query's verb, when the model has no Permissions class" and the
  `--table` refusals.
- AC-007: `scaffold-feature-gen.function.test.ts`, gen strict over a plain and a tenancy service.
- AC-009: the format note tests; `new-command.constant.test.ts` for the flags.
- Revert checks: undoing the `--table` check or the query's `read` fails its test.

## Rollout

A minor changeset for `@stackra/cli`. Additive: existing kinds and flags are unchanged. Ships with the next CLI release.

## Verification

- Unit tests of every helper and of `scaffoldFeature` (files, owners, prefixes, keys, permissions, migrations, refusals,
  dry run) and of the command's output.
- `scaffold-feature-gen.function.test.ts`: gen strict over a plain and a tenancy service built with all five kinds.
- A Linux build host: the same services typecheck, pass oxfmt and oxlint with the repository config, and their 19 generated tests
  (PGlite migrations included) pass.
