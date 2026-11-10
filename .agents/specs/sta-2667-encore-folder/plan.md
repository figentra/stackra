# Implementation Plan: gen writes a service's Encore folder outside the .stackra dot folder

**Spec**: `.agents/specs/sta-2667-encore-folder/spec.md` · **Linear**: STA-2667 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2667-encore-folder/spec.md`

## Summary

One constant, `ENCORE_SERVICES_DIR = "stackra-encore"`, names the folder. Every Encore emitter and the migrations copy
write `stackra-encore/<member>/`; the server entry import becomes `../../.stackra/entry/server` and a sibling's topics
`../../../<folder>/stackra-encore/<member>/events`. `stackra dev` runs `encore run` in the member root. `.gitignore`
ignores the folder, golden trees excepted, and the golden files move.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: gen, cli, database, runway (developer and data)
- **Testing**: vitest in `src/**/__tests__/` and the gen golden files, on CI
- **Storage**: none
- **Runtime target**: the generated Encore app and `stackra dev`

## Constitution Check

| Law                                   | Result | Note                                           |
| ------------------------------------- | ------ | ---------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | cli imports gen's constant (lib to lib)        |
| Secrets (ADR 0009)                    | N/A    | none                                           |
| Security                              | N/A    | none                                           |
| HTTP and events                       | PASS   | endpoints, topics and subscriptions unchanged  |
| Tenancy                               | N/A    | none                                           |
| Delegation                            | PASS   | Claude only                                    |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated (ADR 0091, 0124)        |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                     |
| Versions and catalogs                 | PASS   | a changeset patches gen, cli, database, runway |
| Deploy modes (ADR 0076)               | PASS   | same in all three                              |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                      |
| Docs and ADRs                         | PASS   | ADR 0091 decision 2 amended                    |

## Deploy modes

| Mode       | Behaviour                                           |
| ---------- | --------------------------------------------------- |
| SaaS       | Encore discovers the generated services and builds  |
| On-prem    | Encore discovers the generated services and builds  |
| Air-gapped | Encore discovers the generated services; no network |

## Correctness properties

- **P-001**: no generated path starts with `.stackra/encore/` — Validates: AC-001
- **P-002**: the generated imports reach the entry and siblings from the new depth — Validates: AC-002
- **P-003**: `resolveTool("dev")` for a service runs in the member root and refuses without the folder — Validates:
  AC-003
- **P-004**: `git check-ignore` holds for `services/x/stackra-encore/x/api.ts` and not for a golden file — Validates:
  AC-004

## Architecture overview

Discovery, the IR and the manifest are unchanged. The Encore emitters take their folder from `encoreServiceFolder`
(`stackra-encore/<member>`); `encore.app` stays at the member root, so Encore discovers `stackra-encore/<member>/` as
a service and follows its imports into `.stackra/entry` and `.stackra/gen` as before.

## Components and responsibilities

- `ENCORE_SERVICES_DIR` and `encoreServiceFolder`: the one place the folder is named.
- The Encore emitters (service, api, cron, database, queues, http, inbox, events, relay, subscriptions, broker
  message): write there.
- `ENCORE_APP_IMPORT`: the server entry from the new depth.
- `generate`: copies the migrations into the folder.
- `resolveTool`: `stackra dev` runs `encore run` in the member root.

## Files and folders

```text
packages/developer/gen/
  src/core/constants/encore-services-dir.constant.ts
  src/core/functions/encore-service-folder.function.ts
  src/core/constants/encore-app-import.constant.ts
  src/core/functions/emit-encore-*.function.ts
  src/core/index.ts
  src/node/functions/generate.function.ts
  __golden__/*/expected/services/*/stackra-encore/**
packages/developer/cli/src/node/functions/resolve-tool.function.ts
packages/developer/cli/src/node/create/functions/gen-tree.function.ts
packages/data/database/src/node/functions/database-url.function.ts
packages/developer/runway/src/node/functions/secret-sync-plan.function.ts
packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts
packages/{data/filesystem,runtime/app,tooling/typescript}  (comments naming the folder)
apps/docs/src/docs/adr/0091-generated-encore-app-in-stackra-folder.mdx
.gitignore
.changeset/gen-encore-folder.md
```

## Data models and migrations

none; the generated migrations copy moves with the folder.

## Contracts

`@stackra/gen` exports `ENCORE_SERVICES_DIR`. The generated Encore folder's path changes; a consumer repository adds
`stackra-encore/` to its `.gitignore`.

## Error handling

`stackra dev` refuses a service whose `stackra-encore/` gen has not written, naming the folder.

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002: the emitter tests on the paths and imports; the golden trees.
- AC-003: the resolve-tool test.
- AC-004: the root `.gitignore` patterns, read by CI's checkout (the golden files are committed under them).

## Rollout

A patch changeset for gen, cli, database and runway, in 0.33.1. A service regenerates once; the old
`.stackra/encore/` is ignored and Encore never discovers it. Consumer repositories add `stackra-encore/` to their
`.gitignore`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: RUNWAY's spike on a `next` prerelease is the end-to-end check.

## ADRs

ADR 0091 (Accepted): decision 2 names `stackra-encore/<member>/` for the services.

## Docs

ADR 0091.

## Complexity tracking

none
