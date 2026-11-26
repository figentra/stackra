# Implementation Plan: actions: refuse the memory idempotency and rate-limit stores in deployed environments

**Spec**: `.agents/specs/sta-2798-refuse-memory-stores/spec.md` · **Linear**: STA-2798 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2798-refuse-memory-stores/spec.md`

## Summary

`StoresConfig` learns the running environment from the one reader of STA-2844 and refuses the `memory` action stores
where `isDeployedEnvironment` says the app is deployed. Gen writes runway's `config` values into
`#stackra/runway-config`, which `bootApp` applies as the values layer for the environment `readEnvironment` reads, so
the advice "set a durable store in runway" works. `checkActionStores` in `@stackra/runway` reports the same gap before
a deploy, through `runway validate` and repo-checks. The environment on a deployed Encore service, the closed list,
the runtime-only refusal of `actions.stores.environment` and the generated `environment.ts` are STA-2844's, merged into
this branch; this change keeps no environment enum, list, mapping or reader of its own (the CTO's verdict of
2026-11-26).

## Technical Context

- **Language**: TypeScript (ESM), zod 4
- **Members**: `packages/application/actions`, `packages/developer/runway`, `packages/developer/repo-checks`,
  `packages/runtime/app`, `packages/developer/gen`
- **Testing**: vitest in `src/**/__tests__/`; gen golden fixtures under `__golden__/`
- **Storage**: none (driver selection only)
- **Runtime target**: every deployed service that hosts the action pipeline
- **Depends on**: STA-2844 (stackra#1166), merged in

## Constitution Check

| Law                                   | Result | Note                                                                               |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | actions, app and runway import `@stackra/config` (already dependencies); no Encore |
| Secrets (ADR 0009)                    | PASS   | no secret value in runway or config; `ACTIONS_VALKEY_URL` stays a secret           |
| Security                              | PASS   | the rate limit holds across instances; the judging environment is runtime-only     |
| HTTP and events                       | N/A    | no route or event changes                                                          |
| Tenancy                               | PASS   | idempotency and rate-limit keys keep their tenant scoping                          |
| Delegation                            | PASS   | Claude only                                                                        |
| Not built yet (ADR 0011)              | N/A    | none                                                                               |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`, goldens under `__golden__/`                                 |
| Versions and catalogs                 | PASS   | minor changesets for the five packages, no new dependency                          |
| Deploy modes (ADR 0076)               | PASS   | same refusal in all three                                                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                          |
| Docs and ADRs                         | PASS   | implements ADR 0266 decision 2 and ADR 0296 decision 1 (amended 2026-11-26)        |

## Deploy modes

| Mode       | Behaviour                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| SaaS       | Encore Cloud reports the environment to STA-2844's reader; a deployed service with a memory store fails boot |
| On-prem    | the reader reads the image's infra metadata, or `STACKRA_ENVIRONMENT`; the same refusal applies              |
| Air-gapped | the same as on-prem; `postgres` needs no outside service, so it serves where Valkey is not installed         |

## Correctness properties

- **P-001**: for every environment `isDeployedEnvironment` accepts and each store field, `memory` fails the parse with an issue at that field's path — Validates: AC-001
- **P-002**: `dev`, `test` and an unset variable parse the full defaults with both stores `memory` — Validates: AC-002
- **P-003**: the schema's `environment` options equal `Enum.values(StackraEnvironment)`, a name outside them fails `buildConfig`, and a value for the field fails `buildConfig` — Validates: AC-003
- **P-004**: `checkActionStores` returns an issue exactly for each declared deployed environment and bound port whose resolved driver is not durable or not a candidate, and none for `dev`, undeclared environments or a member with no manifest — Validates: AC-004, AC-005
- **P-005**: the member's runway value wins over the root's default field by field, and `bootApp` applies only the values of the environment `readEnvironment` reads, refusing one outside the closed list — Validates: AC-006, AC-007
- **P-006**: a runway block that sets `actions.stores.environment` is a `runway validate` finding whenever the actions manifest maps the field to `STACKRA_ENVIRONMENT` — Validates: AC-008

## Architecture overview

Three layers close the gap, outermost first:

1. Before a deploy, `checkActionStores` (pure, in `@stackra/runway`) reads the parsed root and service runway and the
   member's committed manifest, and reports each environment `isDeployedEnvironment` accepts that keeps a bound store
   in memory. `runway validate` and repo-checks' `checkRunwayFiles` print it with the file, beside STA-2844's
   `checkRuntimeOnlyConfig`, which refuses `actions.stores.environment` in any runway block.
2. At process start, STA-2844's generated `environment.ts` settles `STACKRA_ENVIRONMENT` through `readEnvironment`.
3. At boot, `bootApp` takes gen's `runwayConfig` and applies the values of `readEnvironment(env)` for each config key;
   `StoresConfig` reads `environment` from `STACKRA_ENVIRONMENT` only, and its schema's refinement refuses `memory`
   when `isDeployedEnvironment(environment)`.

## Components and responsibilities

- `STORES_CONFIG_SCHEMA`, `StoresOptions`, `StoresConfig` (actions): the `environment` field (`StackraEnvironment`, env
  `STACKRA_ENVIRONMENT`) and the refusal, a `superRefine` on the object that asks `isDeployedEnvironment`.
- `checkActionStores`, `ACTION_STORE_PORTS`, `DURABLE_ACTION_STORES` (runway): the pre-deploy check, with driver
  candidates read from the manifest and deployment judged by `isDeployedEnvironment`; `RunwayValidateCommand` reads
  each service's manifest and runs it.
- `checkRunwayFiles`, `structureFindings`, `RunwayApi` (repo-checks): run the optional check for each service runway.
- `bootApp`, `BootOptions`, server `createApp`, `ServerAppOptions` (app): the values layer, keyed by `readEnvironment`.
- `readRunwayConfig`, `discoverMember`, `MemberIR.runwayConfig`, `emitRunwayConfig`, the runtime and console emitters
  (gen): `#stackra/runway-config` and the entries that pass it.

## Files and folders

```text
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
packages/runtime/app/src/server/types/server-app-options.type.ts
packages/developer/gen/src/node/functions/read-runway-config.function.ts
packages/developer/gen/src/node/functions/discover-member.function.ts
packages/developer/gen/src/core/types/member-ir.type.ts
packages/developer/gen/src/core/functions/emit-runway-config.function.ts
packages/developer/gen/src/core/functions/emit-runtime-entries.function.ts
packages/developer/gen/src/core/functions/emit-console-entry.function.ts
packages/developer/gen/src/core/functions/generate-member.function.ts
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

- `StoresConfig$` (`actions.stores`): new field `environment: StackraEnvironment` (env `STACKRA_ENVIRONMENT`, default
  `dev`; runtime-only under STA-2844). Where `isDeployedEnvironment(environment)`, `idempotency: "memory"` or
  `rateLimit: "memory"` is an issue at that path. The manifest gains the env row with `StackraEnvironment`'s values.
- `checkActionStores(root: RootRunway, service: ServiceRunway, manifest: unknown): RunwayIssue[]`, exported from
  `@stackra/runway`. Issue path: `environments.<env>.config.actions.stores.<field>`.
- `BootOptions.runway?` and the server `createApp` option `runway?`: environment to config key to field values;
  `bootApp` picks `runway[readEnvironment(env)]`.
- `RunwayApi.checkActionStores?` in repo-checks (optional, so an older runway build still works).
- Generated file: `.stackra/gen/runway-config.ts` (`export const runwayConfig`).

## Error handling

- Boot: `ConfigInvalidError` from `buildConfig`, naming `actions.stores.idempotency` or `actions.stores.rateLimit`
  and the durable choices and runway key to set; naming `environment` when a value sets it; and, from
  `readEnvironment` in `bootApp`, `env` / `STACKRA_ENVIRONMENT` when the name is outside the closed list.
- Pre-deploy: `checkActionStores` returns issues instead of throwing; `runway validate` prints one line per issue and
  exits non-zero.

## Security and tenancy

The change narrows behaviour only: a deployed environment can no longer run a per-process store that loses
Idempotency-Keys or splits the rate limit. The environment that judges the stores comes from the runtime only, so a
runway file cannot claim `dev` for a production deployment (closed by STA-2844's runtime-only refusal, tested here
for `actions.stores.environment`). Runway holds values, never secrets (ADR 0173).

## Testing strategy

Each behaviour has a test that fails without the change (revert-checked on the branch):

- AC-001, AC-002, AC-003: `packages/application/actions/src/config/__tests__/stores.config.test.ts` (refuses each
  memory store in each deployed environment, keeps them in dev and test, refuses an unknown name, the field's options
  are `StackraEnvironment`'s, a value for `environment` fails).
- AC-004: `packages/developer/runway/src/core/functions/__tests__/check-action-stores.function.test.ts`.
- AC-005, AC-008: `packages/developer/runway/src/node/commands/__tests__/runway-validate.command.test.ts` and
  `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts`.
- AC-006: `emit-runway-config.function.test.ts`, `read-runway-config.function.test.ts`,
  `emit-runtime-entries.function.test.ts`, `commands-of.function.test.ts` and the gen goldens.
- AC-007: `packages/runtime/app/src/core/functions/__tests__/boot-app.function.test.ts` (memory refused in a deployed
  environment; runway's values of the running environment applied; a misspelt environment refused with runway values;
  a runway value for `actions.stores.environment` refused).

The touched packages' tests, typecheck, oxlint and oxfmt pass on box 2 (Linux).

## Rollout

Ship with the next release train after STA-2844: minor changesets for `@stackra/actions`, `@stackra/runway`,
`@stackra/repo-checks`, `@stackra/app` and `@stackra/gen`. Consumers set durable stores in runway, run `stackra gen`,
then deploy; `runway validate` names any service still on memory. Rollback is reverting the release; no data moves.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0266 decision 2; ADR 0296 decision 1 and its amendment of 2026-11-26; ADR 0136 decision 3; ADR 0217 decision 2.
No new ADR.

## Docs

`apps/docs/src/docs/runway/validate.mdx`; READMEs and AGENTS.md of the touched packages; the three changesets.

## Complexity tracking

none
