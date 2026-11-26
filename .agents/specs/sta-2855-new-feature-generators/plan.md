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

## Verification

- Unit tests of every helper and of `scaffoldFeature` (files, owners, prefixes, keys, permissions, migrations, refusals,
  dry run) and of the command's output.
- `scaffold-feature-gen.function.test.ts`: gen strict over a plain and a tenancy service built with all five kinds.
- Box 2: the same services typecheck, pass oxfmt and oxlint with the repository config, and their 19 generated tests
  (PGlite migrations included) pass.
