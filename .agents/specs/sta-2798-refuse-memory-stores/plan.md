# Implementation Plan: actions: refuse the memory idempotency and rate-limit stores in deployed environments

**Spec**: `.agents/specs/sta-2798-refuse-memory-stores/spec.md` · **Linear**: STA-2798 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2798-refuse-memory-stores/spec.md`

## Summary

`StoresConfig` learns the running environment and refuses the `memory` action stores outside `dev` and `test`. Two
supporting changes make the refusal hold on a real deployment and make its advice work: gen writes each Encore
service an `environment.ts` that sets `STACKRA_ENVIRONMENT` from Encore's report, and gen writes runway's `config`
values into `#stackra/runway-config`, which `bootApp` applies as the values layer. `checkActionStores` in
`@stackra/runway` reports the same gap before a deploy, through `runway validate` and repo-checks.

## Technical Context

- **Language**: TypeScript (ESM), zod 4
- **Members**: `packages/application/actions`, `packages/developer/runway`, `packages/developer/repo-checks`,
  `packages/runtime/app`, `packages/developer/gen`
- **Testing**: vitest in `src/**/__tests__/`; gen golden fixtures under `__golden__/`
- **Storage**: none (driver selection only)
- **Runtime target**: every deployed service that hosts the action pipeline; the Encore mapping checked against
  encore 1.58.8

## Constitution Check

| Law                                   | Result | Note                                                                          |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/app` takes `HostEnvironment` structurally; no `encore.dev` import   |
| Secrets (ADR 0009)                    | PASS   | no secret value in runway or config; `ACTIONS_VALKEY_URL` stays a secret      |
| Security                              | PASS   | the rate limit holds across instances; unknown environments fail closed       |
| HTTP and events                       | N/A    | no route or event changes                                                     |
| Tenancy                               | PASS   | idempotency and rate-limit keys keep their tenant scoping                     |
| Delegation                            | PASS   | Claude only                                                                   |
| Not built yet (ADR 0011)              | N/A    | none                                                                          |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`, goldens under `__golden__/`                            |
| Versions and catalogs                 | PASS   | minor changesets for the five packages, no new dependency                     |
| Deploy modes (ADR 0076)               | PASS   | same refusal in all three                                                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                     |
| Docs and ADRs                         | PASS   | implements ADR 0266 decision 2 and ADR 0296 decision 1; docs and READMEs kept |

## Deploy modes

| Mode       | Behaviour                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| SaaS       | Encore Cloud reports the environment; a deployed service with a memory action store fails boot          |
| On-prem    | a self-hosted Encore build reads its infra metadata, or `STACKRA_ENVIRONMENT`; the same refusal applies |
| Air-gapped | the same as on-prem; `postgres` needs no outside service, so it serves where Valkey is not installed    |

## Correctness properties

- **P-001**: for every deployed environment and each store field, `memory` fails the parse with an issue at that field's path — Validates: AC-001
- **P-002**: `dev`, `test` and an unset variable parse the full defaults with both stores `memory` — Validates: AC-002
- **P-003**: a name outside `StoreEnvironment` fails the parse — Validates: AC-003
- **P-004**: `checkActionStores` returns an issue exactly for each declared deployed environment and bound port whose resolved driver is not durable or not a candidate, and none for `dev`, undeclared environments or a member with no manifest — Validates: AC-004, AC-005
- **P-005**: the member's runway value wins over the root's default field by field, and `bootApp` applies only the running environment's values — Validates: AC-006, AC-007
- **P-006**: `runningEnvironment` never returns `dev` or `test` for a deployed host, and returns the declared value under `encore run` and `encore test` — Validates: AC-008, AC-009

## Architecture overview

Three layers close the gap, outermost first:

1. Before a deploy, `checkActionStores` (pure, in `@stackra/runway`) reads the parsed root and service runway and the
   member's committed manifest, and reports each deployed environment that keeps a bound store in memory.
   `runway validate` and repo-checks' `checkRunwayFiles` print it with the file.
2. At process start, the generated `stackra-encore/<member>/environment.ts` runs first in every generated Encore file
   (`encoreFirstImports`) and sets `STACKRA_ENVIRONMENT` from `runningEnvironment(declared, appMeta().environment)`.
3. At boot, `bootApp` takes gen's `runwayConfig` and applies the running environment's values for each config key;
   `StoresConfig` parses them, and its schema's refinement refuses `memory` outside `dev` and `test`.

## Components and responsibilities

- `StoreEnvironment` and `MEMORY_STORE_ENVIRONMENTS` (actions): the closed set of environments and the two that may
  keep the stores in memory.
- `STORES_CONFIG_SCHEMA`, `StoresOptions`, `StoresConfig` (actions): the `environment` field (env
  `STACKRA_ENVIRONMENT`) and the refusal, a `superRefine` on the object.
- `checkActionStores`, `ACTION_STORE_PORTS`, `DURABLE_ACTION_STORES` (runway): the pre-deploy check, with driver
  candidates read from the manifest; `RunwayValidateCommand` reads each service's manifest and runs it.
- `checkRunwayFiles`, `structureFindings`, `RunwayApi` (repo-checks): run the optional check for each service runway.
- `bootApp`, `BootOptions`, server `createApp`, `runningEnvironment`, `HostEnvironment` (app): the values layer and the
  environment mapping.
- `readRunwayConfig`, `discoverMember`, `MemberIR.runwayConfig`, `emitRunwayConfig`, `emitEncoreEnvironment`,
  `encoreFirstImports`, the runtime, console and Encore emitters (gen): the generated files and their import order.

## Files and folders

```text
packages/application/actions/src/core/enums/store-environment.enum.ts
packages/application/actions/src/core/constants/memory-store-environments.constant.ts
packages/application/actions/src/core/constants/stores-config-schema.constant.ts
packages/application/actions/src/core/schemas/stores-options.schema.ts
packages/application/actions/src/config/stores.config.ts
packages/application/actions/stackra.manifest.json
packages/application/actions/src/core/index.ts
packages/developer/runway/src/core/constants/action-store-ports.constant.ts
packages/developer/runway/src/core/constants/durable-action-stores.constant.ts
packages/developer/runway/src/core/functions/check-action-stores.function.ts
packages/developer/runway/src/core/index.ts
packages/developer/runway/src/node/commands/runway-validate.command.ts
packages/developer/repo-checks/src/node/functions/check-runway-files.function.ts
packages/developer/repo-checks/src/node/functions/structure-findings.function.ts
packages/developer/repo-checks/src/node/types/runway-api.type.ts
packages/runtime/app/src/core/functions/boot-app.function.ts
packages/runtime/app/src/core/types/boot-options.type.ts
packages/runtime/app/src/server/functions/create-app.function.ts
packages/runtime/app/src/server/functions/running-environment.function.ts
packages/runtime/app/src/server/types/host-environment.type.ts
packages/runtime/app/src/server/types/server-app-options.type.ts
packages/runtime/app/src/server/index.ts
packages/developer/gen/src/node/functions/read-runway-config.function.ts
packages/developer/gen/src/node/functions/discover-member.function.ts
packages/developer/gen/src/core/types/member-ir.type.ts
packages/developer/gen/src/core/functions/emit-runway-config.function.ts
packages/developer/gen/src/core/functions/emit-encore-environment.function.ts
packages/developer/gen/src/core/functions/encore-first-imports.function.ts
packages/developer/gen/src/core/functions/emit-runtime-entries.function.ts
packages/developer/gen/src/core/functions/emit-console-entry.function.ts
packages/developer/gen/src/core/functions/generate-member.function.ts
packages/developer/gen/src/core/functions/emit-encore-api.function.ts
packages/developer/gen/src/core/functions/emit-encore-cron-jobs.function.ts
packages/developer/gen/src/core/functions/emit-encore-events.function.ts
packages/developer/gen/src/core/functions/emit-encore-http.function.ts
packages/developer/gen/src/core/functions/emit-encore-inbox.function.ts
packages/developer/gen/src/core/functions/emit-encore-queues.function.ts
packages/developer/gen/__golden__/
packages/application/actions/README.md
packages/application/actions/AGENTS.md
packages/developer/runway/README.md
packages/developer/runway/AGENTS.md
packages/developer/gen/README.md
packages/runtime/app/README.md
apps/docs/src/docs/runway/validate.mdx
.changeset/refuse-memory-action-stores.md
.changeset/action-stores-candidates.md
.changeset/runway-values-reach-boot.md
```

## Data models and migrations

none (no table or migration; the durable drivers already exist in `@stackra/database` and `@stackra/actions`)

## Contracts

- `StoresConfig$` (`actions.stores`): new field `environment: "dev" | "preview" | "test" | "staging" | "production"`
  (env `STACKRA_ENVIRONMENT`, default `dev`). Outside `dev` and `test`, `idempotency: "memory"` or
  `rateLimit: "memory"` is an issue at that path. The manifest gains the env row and the `actions.StoreEnvironment`
  type; `StoreEnvironment` is exported from the package root.
- `checkActionStores(root: RootRunway, service: ServiceRunway, manifest: unknown): RunwayIssue[]`, exported from
  `@stackra/runway`. Issue path: `environments.<env>.config.actions.stores.<field>`.
- `BootOptions.runway?` and the server `createApp` option `runway?`: environment to config key to field values.
- `runningEnvironment(declared: string | undefined, host: HostEnvironment): string | undefined` and
  `interface HostEnvironment { name; type; cloud }`, exported from `@stackra/app/server`.
- `RunwayApi.checkActionStores?` in repo-checks (optional, so an older runway build still works).
- Generated files: `.stackra/gen/runway-config.ts` (`export const runwayConfig`) and
  `stackra-encore/<member>/environment.ts`, imported first by every generated Encore file.

## Error handling

- Boot: `ConfigInvalidError` from `buildConfig`, naming `actions.stores.idempotency` or `actions.stores.rateLimit`
  and the durable choices and runway key to set.
- Environment: `ConfigInvalidError("env", …)` at path `STACKRA_ENVIRONMENT` when a deployed host declares `dev` or
  `test`, or nothing tells the environment; thrown from `environment.ts`, so the process fails before the app loads.
- Pre-deploy: `checkActionStores` returns issues instead of throwing; `runway validate` prints one line per issue and
  exits non-zero.

## Security and tenancy

The change narrows behaviour only: a deployed environment can no longer run a per-process store that loses
Idempotency-Keys or splits the rate limit. Runway holds values, never secrets (ADR 0173). Known gap (spec Risks): the
values layer can set `actions.stores.environment`; the follow-up refuses or excludes it.

## Testing strategy

Each behaviour has a test that fails without the change (revert-checked on the branch):

- AC-001, AC-002, AC-003: `packages/application/actions/src/config/__tests__/stores.config.test.ts` (reads the
  environment, refuses one memory store, refuses an unknown name) and
  `packages/application/actions/src/core/enums/__tests__/store-environment.enum.test.ts`.
- AC-004: `packages/developer/runway/src/core/functions/__tests__/check-action-stores.function.test.ts` (seven cases:
  durable passes, default memory, explicit memory with member over root, non-candidate driver, bound ports only, no
  manifest, `dev` and undeclared skipped).
- AC-005: `packages/developer/runway/src/node/commands/__tests__/runway-validate.command.test.ts` and
  `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts`.
- AC-006: `emit-runway-config.function.test.ts`, `read-runway-config.function.test.ts`,
  `emit-runtime-entries.function.test.ts`, `commands-of.function.test.ts` and the gen goldens.
- AC-007: `packages/runtime/app/src/core/functions/__tests__/boot-app.function.test.ts` (fails boot with memory in a
  deployed environment; applies runway's values of the running environment).
- AC-008: `emit-encore-environment.function.test.ts`, `emit-encore-cron-jobs.function.test.ts` (import order) and the
  `environment.ts.golden` files.
- AC-009: `packages/runtime/app/src/server/functions/__tests__/running-environment.function.test.ts`.

The touched packages' tests, typecheck, oxlint and oxfmt pass; the Encore mapping was checked against encore 1.58.8.

## Rollout

Ship with the next release train: minor changesets for `@stackra/actions`, `@stackra/runway`, `@stackra/repo-checks`,
`@stackra/app` and `@stackra/gen`. Consumers set durable stores in runway, run `stackra gen`, then deploy;
`runway validate` names any service still on memory. Rollback is reverting the release; no data moves.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0266 decision 2; ADR 0296 decision 1; ADR 0136 decision 3; ADR 0217 decision 2; ADR 0091 decision 2; ADR 0124.
No new ADR.

## Docs

`apps/docs/src/docs/runway/validate.mdx`; READMEs and AGENTS.md of the touched packages; the three changesets.

## Complexity tracking

none
