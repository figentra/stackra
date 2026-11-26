# Feature Specification: actions: refuse the memory idempotency and rate-limit stores in deployed environments

**Feature Branch**: `figentra/sta-2798-refuse-memory-stores`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: CTO

**Linear**: STA-2798

**Clarifications status**: complete

**Input**: `@stackra/actions` defaults the idempotency store and the rate-limit store to `memory` (ADR 0266 decision 2),
and nothing refused that in a deployed app. On a restart every Idempotency-Key was forgotten, so a retried write ran
twice (ADR 0136 decision 3); with several instances each kept its own token buckets, so the rate limit multiplied with
the instances (ADR 0217 decision 2). Two gaps kept the fix from being applied: a deployed Encore service never set
`STACKRA_ENVIRONMENT` (it booted as `dev`), and runway's `config.actions.stores` values never reached boot (ADR 0296
decision 1 names runway's values as the last configuration layer, but no entry applied them).

### Sources

- STA-2798 (Linear); stackra#1093 (this branch's pull request, its independent review notes)
- ADR 0266 decision 2 (memory first, a production driver before production); ADR 0296 decision 1 (runway values are
  the last layer); ADR 0136 decision 3 (the idempotency store); ADR 0217 decision 2 (the rate limit); ADR 0091
  decision 2 and ADR 0124 (Encore facts come from the generated app)
- `packages/application/actions/src/core/constants/stores-config-schema.constant.ts`;
  `packages/developer/runway/src/core/functions/check-action-stores.function.ts`;
  `packages/runtime/app/src/server/functions/running-environment.function.ts`;
  `packages/developer/gen/src/core/functions/emit-encore-environment.function.ts`

## Impact

- **Apps touched**: none (`apps/docs` page `runway/validate.mdx` only)
- **Services touched**: none directly; every generated Encore service gets `stackra-encore/<member>/environment.ts`
  and, when its runway sets a `config` value, `.stackra/gen/runway-config.ts` on its next `stackra gen`
- **Packages touched**: `@stackra/actions`, `@stackra/runway`, `@stackra/repo-checks`, `@stackra/app`, `@stackra/gen`
- **Public contract change**: `StoresConfig$` (`actions.stores`) gains the `environment` field (closed enum
  `StoreEnvironment`, env `STACKRA_ENVIRONMENT`, default `dev`) and refuses `memory` for `idempotency` or `rateLimit`
  outside `dev` and `test`; `@stackra/actions` exports `StoreEnvironment` and its manifest lists the new env row and the
  `actions.StoreEnvironment` type; `@stackra/runway` exports `checkActionStores(root, service, manifest)`;
  `@stackra/app` `BootOptions` and the server `createApp` options gain `runway`, and `./server` exports
  `runningEnvironment(declared, host)` and the `HostEnvironment` type; repo-checks' `RunwayApi` gains the optional
  `checkActionStores`; gen's `MemberIR` gains the optional `runwayConfig`
- **Cross-service events**: none
- **Tenancy and data**: no schema or row change; the change keeps Idempotency-Keys and token buckets durable and shared
  across instances in every deployed environment, which ends duplicate writes on retry after a restart
- **Security and privacy**: the rate limit now holds across instances in a deployment; runway values carry no secret
  (ADR 0173), and `buildConfig` still refuses a value for a `@Secret` field
- **Secrets**: none new (`ACTIONS_VALKEY_URL` unchanged)
- **ADR needed**: no (implements ADR 0266 decision 2 and ADR 0296 decision 1)
- **New dependencies**: none
- **Deploy modes**: the same refusal in all three; a self-hosted Encore build must set `STACKRA_ENVIRONMENT` or the
  infra config's `metadata.env_type` and `cloud`
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runway/validate.mdx`; the READMEs and AGENTS.md of `@stackra/actions`,
  `@stackra/runway`, `@stackra/gen` and `@stackra/app`; three changesets
- **Lane**: full
- **Change risk**: R2 (boot now fails for a deployed service that keeps either action store in memory; a public
  config schema, two exported functions and a boot option change)

## Compatibility and migration

- A deployed service (`preview`, `staging`, `production`) that relied on the `memory` default no longer boots: it fails
  with `ConfigInvalidError` naming `actions.stores.idempotency` or `actions.stores.rateLimit`. Before upgrading, select
  `postgres` (with `@stackra/database`) or `valkey` in runway, for example in the root's `defaults.service.config` of
  each deployed environment: `actions.stores: { idempotency: postgres, rateLimit: postgres }`. `runway validate` and
  `stackra validate --repository` report the same gap before a deploy.
- After upgrading, run `stackra gen` so each service gets `environment.ts` and, where runway sets values,
  `runway-config.ts`. Until then a deployed Encore service still boots as `dev`.
- `dev`, `test` and an unset `STACKRA_ENVIRONMENT` keep the memory default, so local runs, `encore run` and
  `encore test` are unchanged.
- A misspelt `STACKRA_ENVIRONMENT` now fails config instead of running as `dev`.
- Every new field and option is additive: `environment` has a default, `runway` and `runwayConfig` are optional, and
  repo-checks treats a runway build without `checkActionStores` as before.
- Semver: minor for `@stackra/actions`, `@stackra/runway`, `@stackra/repo-checks`, `@stackra/app` and `@stackra/gen`;
  a further patch for `@stackra/runway` (driver candidates) and `@stackra/actions` (docs).

## Risks

- The runway values layer can set `actions.stores.environment`, so a runway file could declare `dev` under a
  production deployment and pass the boot refusal. Follow-up on STA-2798: refuse a differing `environment` in
  `checkActionStores`, or keep the field out of the values layer.
- `runway validate` and repo-checks' `structureFindings` parse `stackra.manifest.json` without a guard, and gen's
  `readRunwayConfig` parses `runway.yaml` without one: a malformed file stops the command with a raw error instead of a
  finding. Follow-up.
- Worker members that bind the action stores are not checked by `checkActionStores` yet. Follow-up.
- A self-hosted Encore build with no infra metadata and no declared `STACKRA_ENVIRONMENT` now fails boot (closed by
  design: an unknown environment never runs as `dev`).

## Acceptance criteria

- **AC-001**: WHILE `STACKRA_ENVIRONMENT` is `preview`, `staging` or `production`, THE `StoresConfig` schema SHALL refuse a `memory` idempotency or rate-limit store, so `buildConfig` and boot fail with `ConfigInvalidError` naming the field.
- **AC-002**: WHERE `STACKRA_ENVIRONMENT` is `dev`, `test` or unset, THE `StoresConfig` schema SHALL keep the `memory` default for both stores.
- **AC-003**: IF `STACKRA_ENVIRONMENT` names an environment outside `StoreEnvironment` THEN THE `StoresConfig` schema SHALL refuse it instead of running as `dev`.
- **AC-004**: WHEN a service's manifest binds `actions.IdempotencyStore` or `actions.RateLimitStore` and a deployed environment the root declares selects no durable driver for it, or a driver the manifest does not list as a candidate, THE `checkActionStores` function SHALL return one issue naming the environment and field.
- **AC-005**: WHEN `checkActionStores` reports an issue, THE `runway validate` command and `stackra validate --repository` SHALL fail with it, naming the service's runway file.
- **AC-006**: WHEN a service's runway or the root's `defaults.service.config` sets a `config` value, THE gen SHALL write `.stackra/gen/runway-config.ts` with the member's values over the root's field by field, and the server, seed and console entries SHALL pass it as `runway`.
- **AC-007**: WHEN `bootApp` receives `runway`, THE `bootApp` function SHALL apply the running environment's values (`dev` when `STACKRA_ENVIRONMENT` is unset) as the values layer of each configuration class.
- **AC-008**: WHEN a generated Encore file loads, THE generated `environment.ts` SHALL set `STACKRA_ENVIRONMENT` from Encore's `appMeta().environment` through `runningEnvironment` before the server app loads.
- **AC-009**: IF a deployed host declares `dev` or `test`, or reports no deployed environment while nothing is declared, THEN THE `runningEnvironment` function SHALL throw `ConfigInvalidError` naming `STACKRA_ENVIRONMENT`.

## Open questions

None.

## Status history

- 2026-11-26 → Clarified (the PR's diff and its independent review)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
