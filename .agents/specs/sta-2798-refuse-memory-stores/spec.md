# Feature Specification: actions: refuse the memory idempotency and rate-limit stores in deployed environments

**Feature Branch**: `figentra/sta-2798-refuse-memory-stores`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO

**Linear**: STA-2798

**Clarifications status**: complete

**Input**: `@stackra/actions` defaults the idempotency store and the rate-limit store to `memory` (ADR 0266 decision 2),
and nothing refused that in a deployed app. On a restart every Idempotency-Key was forgotten, so a retried write ran
twice (ADR 0136 decision 3); with several instances each kept its own token buckets, so the rate limit multiplied with
the instances (ADR 0217 decision 2). Runway's `config.actions.stores` values never reached boot either (ADR 0296
decision 1 names runway's values as the last configuration layer, but no entry applied them), so the advice "set a
durable store in runway" did not work. The CTO's verdict of 2026-11-26 sent the first version back: it read the
environment through its own enum and its own Encore mapping, and the values layer could override it. This version
builds on the one environment reader of STA-2844 (stackra#1166) and keeps no reader of its own.

### Sources

- STA-2798 (Linear); stackra#1093 (this branch's pull request, its independent review notes); the CTO's spec verdicts
  of 2026-11-26 ("#1093: move onto the STA-2844 reader")
- STA-2844 and its spec `.agents/specs/sta-2844-one-environment-reader/` (`readEnvironment`, `isDeployedEnvironment`,
  `StackraEnvironment`, the runtime-only refusal, `providePlatformEnvironment` and the generated `environment.ts`),
  merged into this branch
- ADR 0266 decision 2 (memory first, a production driver before production); ADR 0296 decision 1 (runway values are
  the last layer) and its amendment of 2026-11-26 (the environment comes from the runtime only); ADR 0136 decision 3
  (the idempotency store); ADR 0217 decision 2 (the rate limit)
- `packages/application/actions/src/core/constants/stores-config-schema.constant.ts`;
  `packages/developer/runway/src/core/functions/check-action-stores.function.ts`;
  `packages/runtime/app/src/core/functions/boot-app.function.ts`;
  `packages/developer/gen/src/core/functions/emit-runway-config.function.ts`

## Impact

- **Apps touched**: none (`apps/docs` page `runway/validate.mdx` only)
- **Services touched**: none directly; a generated service whose runway sets a `config` value gets
  `.stackra/gen/runway-config.ts` on its next `stackra gen` (its `environment.ts` comes from STA-2844)
- **Packages touched**: `@stackra/actions`, `@stackra/runway`, `@stackra/repo-checks`, `@stackra/app`, `@stackra/gen`
- **Public contract change**: `StoresConfig$` (`actions.stores`) gains the `environment` field, typed as
  `StackraEnvironment` of `@stackra/config` and mapped to `STACKRA_ENVIRONMENT` (default `dev`), and refuses `memory`
  for `idempotency` or `rateLimit` where `isDeployedEnvironment` is true; the actions manifest lists the new env row
  (values from `StackraEnvironment`); `@stackra/runway` exports `checkActionStores(root, service, manifest)`;
  `@stackra/app` `BootOptions` and the server `createApp` options gain `runway`; repo-checks' `RunwayApi` gains the
  optional `checkActionStores`; gen's `MemberIR` gains the optional `runwayConfig`. No environment enum, list or
  reader of its own is exported.
- **Cross-service events**: none
- **Tenancy and data**: no schema or row change; the change keeps Idempotency-Keys and token buckets durable and shared
  across instances in every deployed environment, which ends duplicate writes on retry after a restart
- **Security and privacy**: the rate limit now holds across instances in a deployment; the environment that judges the
  stores is runtime-only (a runway or test value for `actions.stores.environment` fails boot and `runway validate`);
  runway values carry no secret (ADR 0173), and `buildConfig` still refuses a value for a `@Secret` field
- **Secrets**: none new (`ACTIONS_VALKEY_URL` unchanged)
- **ADR needed**: no (implements ADR 0266 decision 2 and ADR 0296 decision 1, under ADR 0296's amendment of 2026-11-26)
- **New dependencies**: none (`@stackra/actions`, `@stackra/app` and `@stackra/runway` already depend on
  `@stackra/config`)
- **Deploy modes**: the same refusal in all three; the running environment is STA-2844's (a self-hosted image without
  infra metadata sets `STACKRA_ENVIRONMENT`)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runway/validate.mdx`; the READMEs and AGENTS.md of `@stackra/actions`,
  `@stackra/runway`, `@stackra/gen` and `@stackra/app`; three changesets
- **Lane**: full
- **Change risk**: R2 (boot now fails for a deployed service that keeps either action store in memory; a public
  config schema, an exported function and a boot option change)

## Compatibility and migration

- Depends on STA-2844 (stackra#1166): this branch merges it, so #1166 lands first or with it.
- A deployed service (`preview`, `staging`, `production`) that relied on the `memory` default no longer boots: it fails
  with `ConfigInvalidError` naming `actions.stores.idempotency` or `actions.stores.rateLimit`. Before upgrading, select
  `postgres` (with `@stackra/database`) or `valkey` in runway, for example in the root's `defaults.service.config` of
  each deployed environment: `actions.stores: { idempotency: postgres, rateLimit: postgres }`. `runway validate` and
  `stackra validate --repository` report the same gap before a deploy.
- After upgrading, run `stackra gen` so each service gets, where runway sets values, `runway-config.ts`.
- `dev`, `test` and an unset `STACKRA_ENVIRONMENT` keep the memory default, so local runs, `encore run` and
  `encore test` are unchanged.
- A misspelt `STACKRA_ENVIRONMENT` fails boot (the reader's closed list), and with runway values `bootApp` refuses it
  instead of applying no environment's values.
- A runway `config` block or test `values` that set `actions.stores.environment` fail boot and `runway validate`.
- Every new field and option is additive: `environment` has a default, `runway` and `runwayConfig` are optional, and
  repo-checks treats a runway build without `checkActionStores` as before.
- Semver: minor for `@stackra/actions`, `@stackra/runway`, `@stackra/repo-checks`, `@stackra/app` and `@stackra/gen`;
  a further patch for `@stackra/runway` (driver candidates) and `@stackra/actions` (docs).

## Risks

- `runway validate` and repo-checks' `structureFindings` parse `stackra.manifest.json` without a guard (so does
  `readRunways`, on main, before either check runs), and gen's `readRunwayConfig` parses `runway.yaml` without one: a
  malformed file stops the command with a raw error instead of a finding. Follow-up.
- Worker members that bind the action stores are not checked by `checkActionStores` yet. Follow-up.
- The CTO's merge order regenerates the `http.ts` goldens after stackra#1088 lands; this branch's goldens are STA-2844's
  and change only if #1088 changes them.

## Acceptance criteria

- **AC-001**: WHILE the running environment is deployed (`isDeployedEnvironment`: `preview`, `staging` or `production`), THE `StoresConfig` schema SHALL refuse a `memory` idempotency or rate-limit store, so `buildConfig` and boot fail with `ConfigInvalidError` naming the field.
- **AC-002**: WHERE the running environment is `dev` or `test`, or `STACKRA_ENVIRONMENT` is unset, THE `StoresConfig` schema SHALL keep the `memory` default for both stores.
- **AC-003**: THE `StoresConfig` schema SHALL type `environment` as `StackraEnvironment` of `@stackra/config` and read it from `STACKRA_ENVIRONMENT` only, so a name outside that list fails boot and a value for it fails boot.
- **AC-004**: WHEN a service's manifest binds `actions.IdempotencyStore` or `actions.RateLimitStore` and a deployed environment the root declares selects no durable driver for it, or a driver the manifest does not list as a candidate, THE `checkActionStores` function SHALL return one issue naming the environment and field.
- **AC-005**: WHEN `checkActionStores` reports an issue, THE `runway validate` command SHALL fail with it, naming the service's runway file, and so SHALL `stackra validate --repository`.
- **AC-006**: WHEN a service's runway or the root's `defaults.service.config` sets a `config` value, THE gen SHALL write `.stackra/gen/runway-config.ts` with the member's values over the root's field by field, and pass it as `runway` from the server, seed and console entries.
- **AC-007**: WHEN `bootApp` receives `runway`, THE `bootApp` function SHALL apply the values of the environment `readEnvironment` reads (`dev` when unset) as the values layer of each configuration class, and fail boot when that environment is outside the closed list.
- **AC-008**: IF a runway `config` block sets `actions.stores.environment` THEN THE `runway validate` command SHALL report it with the file and the path, as STA-2844's runtime-only check of the actions manifest's env row.

## Open questions

None.

## Status history

- 2026-11-26 → Clarified (the PR's diff and its independent review)
- 2026-11-26 → Planned (plan.md)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Clarified (the CTO's verdict: move onto the STA-2844 reader; STA-2844 merged into this branch)
- 2026-11-26 → Implementing (rebuilt on `readEnvironment` and `isDeployedEnvironment`; awaiting the CTO's approval)
