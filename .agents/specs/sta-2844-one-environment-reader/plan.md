# Implementation Plan: one reader decides the running environment, from the runtime only

**Spec**: `.agents/specs/sta-2844-one-environment-reader/spec.md` · **Linear**: STA-2844 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2844-one-environment-reader/spec.md`

## Summary

`@stackra/config` gains the closed list `StackraEnvironment`, the one reader `readEnvironment(raw, platform?)` and the
gate `isDeployedEnvironment`. `layerConfig` refuses a value for a field mapped to a variable in
`SAFETY_CRITICAL_VARIABLES` (`STACKRA_ENVIRONMENT`) and checks a set `STACKRA_ENVIRONMENT` against the list.
`@stackra/app/server` gains `providePlatformEnvironment`, which the generated `environment.ts` calls with Encore's
`appMeta().environment`; `createApp` builds the configuration with the reader's answer. `@stackra/runway` refuses the
same fields in runway `config` blocks, reading them from installed manifests, in `runway validate` and through
`@stackra/repo-checks` in `stackra validate --repository`.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/config`, `packages/runtime/app`, `packages/developer/gen`,
  `packages/developer/runway`, `packages/developer/repo-checks`
- **Testing**: vitest in `src/**/__tests__/`; the gen goldens; the reader proved under `encore test` in the
  stackra-demo container
- **Storage**: none
- **Runtime target**: every server process (`createApp`), every generated Encore service, runway and validate in CI

## Constitution Check

| Law                                   | Result | Note                                                               |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | app and runway already depend on config; no new member edge        |
| Secrets (ADR 0009)                    | N/A    | none read or written                                               |
| Security                              | PASS   | fails closed; refusals name the variable and rule, never the value |
| HTTP and events                       | N/A    | none                                                               |
| Tenancy                               | N/A    | none                                                               |
| Delegation                            | PASS   | Claude only                                                        |
| Not built yet (ADR 0011)              | N/A    | none                                                               |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                              |
| Versions and catalogs                 | PASS   | one minor changeset for config, app, gen, runway and repo-checks   |
| Deploy modes (ADR 0076)               | PASS   | a self-hosted image without metadata sets the variable             |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                          |
| Docs and ADRs                         | PASS   | ADR 0296 amendment; config, app, gen and runway READMEs            |

## Deploy modes

| Mode       | Behaviour                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- |
| SaaS       | Encore Cloud reports type and name; the environment is derived, no variable needed                |
| On-prem    | a self-hosted image with infra metadata is derived; without it, `STACKRA_ENVIRONMENT` must be set |
| Air-gapped | the same as on-prem; the reader makes no call out                                                 |

## Correctness properties

- **P-001**: the reader answers each of the five names, trims spaces, and refuses `prod`, `Production`,
  `development`, `local` and a non-string without printing them — Validates: AC-001, AC-002
- **P-002**: with no platform unset and empty are `dev`; `encore run` unset is `dev`, `encore test` unset is `test`,
  and a declared value is kept there — Validates: AC-003
- **P-003**: type `production` derives `production`, `ephemeral` `preview`, a deployed name `staging` or `production`
  itself, any other deployed name `staging`; `dev` or `test` declared there and a contradicting value are refused —
  Validates: AC-004
- **P-004**: empty name with cloud `local`, and an unknown name with cloud `local`, refuse unset and keep a declared
  value — Validates: AC-005
- **P-005**: `buildConfig` refuses `values: { environment }` for a field mapped to `STACKRA_ENVIRONMENT`, names a typo
  by the field, keeps another field a value — Validates: AC-006
- **P-006**: `createApp` boots `production` and `staging` on deployed platforms with no variable, `dev` and a declared
  `preview` with none, and rejects `dev` on a deployment, `prod` and a bare image; `providePlatformEnvironment`
  settles the variable and records the platform only on success — Validates: AC-007
- **P-007**: gen writes `environment.ts` for a service with `@stackra/app` and none for a package, an app, a v2 service
  or a service without the dependency; each generated Encore file imports `./environment` then `./database`; the
  goldens hold it — Validates: AC-008
- **P-008**: `checkRuntimeOnlyConfig` reports a member's and the root's `config` field at its path; `runway validate`
  exits 1 with the file and path and 0 once the field is gone; `checkRunwayFiles` forwards the fields and reports the
  finding — Validates: AC-009
- **P-009**: `isDeployedEnvironment` is true for exactly `preview`, `staging`, `production` — Validates: AC-010

## Architecture overview

The reader is pure: `readEnvironment(raw, platform?)`. With no platform it answers the declared value or `dev`. With a
platform it classifies the report: a developer machine (`encore run`, `encore test`), a deployment (type `production`
or `ephemeral`, or a cloud other than `local`), or unknown (cloud `local` and any other name). A deployment fixes its
environment when its type or name says one; otherwise it derives `staging`. The process gets the platform's report
once, from the generated `environment.ts`, which runs before any generated Encore file loads the app: it settles
`STACKRA_ENVIRONMENT` in `process.env`, so every later reader of the variable (a configuration class, the generated
relay table) sees the deployment. `createApp` reads again with the recorded platform, so a hand-built app and a unit
test go through the same reader.

## Components and responsibilities

- `StackraEnvironment` (config `core/enums`): the closed list.
- `readEnvironment`, `isDeployedEnvironment` (config `core/functions`): the reader and the deployed gate.
- `ENVIRONMENT_VARIABLE`, `SAFETY_CRITICAL_VARIABLES` (config `core/constants`): the variable and the runtime-only list.
- `PlatformEnvironment` (config `core/types`): the structural shape of the platform's report.
- `layerConfig` (config, internal): the closed-list check and the runtime-only refusal.
- `providePlatformEnvironment`, `PLATFORM_ENVIRONMENT_HOST` (app `server`): record the report, settle the variable.
- `createApp` (app `server`): boots with the reader's answer.
- `emitEncoreEnvironment`, `encoreSetupImports` (gen `core/functions`): the generated file and its import order.
- `runtimeOnlyFields`, `checkRuntimeOnlyConfig` (runway `core`), `stackraManifests`, `runtimeOnlyFieldsOf` (runway
  `node`), `RunwayValidateCommand`: the validate-time refusal.
- `checkRunwayFiles`, `structureFindings`, `RunwayApi`, `RuntimeOnlyFieldShape` (repo-checks): the same in
  `stackra validate --repository`.

## Files and folders

```text
packages/foundation/config/
  README.md
  stackra.manifest.json
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/core/constants/{environment-variable,safety-critical-variables}.constant.ts
  src/core/constants/__tests__/safety-critical-variables.constant.test.ts
  src/core/constants/env.constant.ts
  src/core/enums/stackra-environment.enum.ts
  src/core/enums/__tests__/stackra-environment.enum.test.ts
  src/core/functions/{read-environment,is-deployed-environment,layer-config,env-value}.function.ts
  src/core/functions/__tests__/{read-environment,is-deployed-environment,build-config}.function.test.ts
  src/core/types/platform-environment.type.ts
packages/runtime/app/
  README.md
  src/server/index.ts
  src/server/__tests__/index.test.ts
  src/server/constants/platform-environment-host.constant.ts
  src/server/functions/{provide-platform-environment,create-app}.function.ts
  src/server/functions/__tests__/{provide-platform-environment.function,create-app.environment}.test.ts
packages/developer/gen/
  README.md
  __golden__/*/expected/services/*/stackra-encore/*/{environment,api,cron,http,subscriptions,inbox}.ts.golden
  src/core/functions/{emit-encore-environment,encore-setup-imports,generate-member}.function.ts
  src/core/functions/emit-encore-{api,cron-jobs,events,http,inbox,queues}.function.ts
  src/core/functions/__tests__/{emit-encore-environment,encore-setup-imports,emit-encore-cron-jobs,generate-member}.function.test.ts
packages/developer/runway/
  README.md
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/core/types/runtime-only-field.type.ts
  src/core/functions/{runtime-only-fields,check-runtime-only-config}.function.ts
  src/core/functions/__tests__/{runtime-only-fields,check-runtime-only-config}.function.test.ts
  src/node/index.ts
  src/node/__tests__/index.test.ts
  src/node/functions/{stackra-manifests,runtime-only-fields-of}.function.ts
  src/node/functions/__tests__/{stackra-manifests,runtime-only-fields-of}.function.test.ts
  src/node/commands/runway-validate.command.ts
  src/node/commands/__tests__/runway-validate.command.test.ts
packages/developer/repo-checks/src/node/
  functions/{check-runway-files,structure-findings}.function.ts
  functions/__tests__/repository-checks.test.ts
  types/{runway-api,runtime-only-field-shape}.type.ts
packages/runtime/outbox/src/ (tests and fixture only)
packages/foundation/market-packs/src/core/drivers/__tests__/bundled-resolved-pack-source.driver.test.ts
apps/docs/src/docs/adr/0296-runway-v3-member-requires-and-root-topology-groups.mdx
.changeset/one-environment-reader.md
```

## Data models and migrations

none

## Contracts

- `readEnvironment(raw: Readonly<Record<string, unknown>>, platform?: PlatformEnvironment): StackraEnvironment`;
  throws `ConfigInvalidError` (config `env`, path `STACKRA_ENVIRONMENT`).
- `isDeployedEnvironment(environment: StackraEnvironment): boolean`.
- `StackraEnvironment`: `dev | test | preview | staging | production` (`Enum.of`; manifest schema
  `config.StackraEnvironment`).
- `SAFETY_CRITICAL_VARIABLES: readonly string[]` (frozen, `["STACKRA_ENVIRONMENT"]`); `ENVIRONMENT_VARIABLE`.
- `providePlatformEnvironment(platform: PlatformEnvironment, env = process.env): StackraEnvironment`.
- `checkRuntimeOnlyConfig(document: unknown, fields: readonly RuntimeOnlyField[]): RunwayIssue[]`;
  `runtimeOnlyFields(manifests: readonly unknown[]): RuntimeOnlyField[]`; `runtimeOnlyFieldsOf(root: string)`.
- Generated: `stackra-encore/<member>/environment.ts`, imported first by `api.ts`, `cron.ts`, `http.ts`, `events.ts`,
  `inbox.ts`, `queues.ts` and `subscriptions.ts`.

## Error handling

- A typo: `ConfigInvalidError` "is not a Stackra environment: set one of …", by the variable (reader) or the field
  (`buildConfig`).
- `dev` or `test` on a deployment, a contradicting value, a bare image with nothing set: `ConfigInvalidError` naming
  the rule and what the platform reported (type, cloud), never the value.
- A runtime-only value: `ConfigInvalidError` "is safety-critical: it is read from STACKRA_ENVIRONMENT in the runtime
  environment only"; in runway, one finding per path.
- The generated `environment.ts` throws at import, so the process fails before it serves.

## Security and tenancy

The change removes a way to relax every dev-only check from configuration. The environment is read from the process
and the platform only; the platform's report is trusted as the runtime's own. No tenant data is involved.

## Testing strategy

- AC-001 to AC-005, AC-010: `read-environment.function.test.ts`, `is-deployed-environment.function.test.ts`,
  `stackra-environment.enum.test.ts`, `safety-critical-variables.constant.test.ts`; `encore test` proof in the
  stackra-demo container (`appMeta().environment` is `test`/`test`/`local`; unset answers `test`, `staging` is kept,
  `prod` is refused).
- AC-006: `build-config.function.test.ts`; outbox and market-packs tests moved to the runtime variable.
- AC-007: `create-app.environment.test.ts`, `provide-platform-environment.function.test.ts`.
- AC-008: `emit-encore-environment.function.test.ts`, `encore-setup-imports.function.test.ts`, the cron and member
  tests, the goldens.
- AC-009: `check-runtime-only-config.function.test.ts`, `runtime-only-fields.function.test.ts`,
  `stackra-manifests.function.test.ts`, `runtime-only-fields-of.function.test.ts`,
  `runway-validate.command.test.ts`, `repository-checks.test.ts`.
- Revert checks: reverting `layer-config`, `create-app`, `generate-member`, `runway-validate` or `check-runway-files`
  fails its tests (PR notes); typecheck, oxlint and oxfmt on every touched package.

## Rollout

One minor changeset. Services pick up `environment.ts` at their next `stackra gen` after upgrading; Encore Cloud
deployments then run as their deployed environment. Then stackra#1093, #1095 and #1104 rebase onto the reader, and
#1094 and #1098 refuse their memory defaults through `isDeployedEnvironment`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R3: boot refuses what it used to accept, so the changeset carries the
upgrade steps.

## ADRs

ADR 0296 (2026-11-26 amendment: safety-critical keys come from the runtime only).

## Docs

The config, app, gen and runway READMEs; ADR 0296; the changeset.

## Complexity tracking

none
