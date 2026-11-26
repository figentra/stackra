# Feature Specification: one reader decides the running environment, from the runtime only

**Feature Branch**: `figentra/sta-2844-one-environment-reader`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (Idris), under the owner's go of 2026-11-26

**Linear**: STA-2844

**Clarifications status**: complete

**Input**: Runway's values layer is applied last (ADR 0296 decision 1), so a runway `config` block could set
`environment: dev` on a deployed app. Three open pull requests read the environment three different ways
(`actions.stores.environment` in stackra#1093, `actions.audit.environment` in stackra#1095, `app.bearer.environment` in
stackra#1104), and the values layer could override all three: a deployment could keep memory stores, run actions
unaudited or accept dev tokens. A deployed Encore service also could not set `STACKRA_ENVIRONMENT` at all, so it read
as `dev`. The owner said go (26 Nov); the CTO's verdict asks for one closed-list reader, read from the runtime only,
that the safety pull requests rebase onto.

### Sources

- Linear STA-2844 ("Done when"); the CTO spec verdicts of 2026-11-26
- ADR 0296 decision 1 (runway `config` values are the last layer), amended here on 2026-11-26
- ADR 0170 decision 5 (the environments a release is promoted through)
- `packages/foundation/config/src/core/functions/layer-config.function.ts` (the values layer)
- `packages/runtime/app/src/server/functions/create-app.function.ts` (the server boot)
- what `encore test` reports through `appMeta().environment`, read in the stackra-demo container:
  `{ name: "test", type: "test", cloud: "local" }`

## Impact

- **Apps touched**: apps/docs (ADR 0296 gains the 2026-11-26 amendment)
- **Services touched**: none changed; every service that runs `@stackra/app` gets a generated
  `stackra-encore/<member>/environment.ts` at its next `stackra gen`
- **Packages touched**: packages/foundation/config (the reader, the closed list, the runtime-only refusal);
  packages/runtime/app (`providePlatformEnvironment`, `createApp`); packages/developer/gen (`environment.ts`, setup
  imports, goldens); packages/developer/runway (`checkRuntimeOnlyConfig`, `runtimeOnlyFields`, `runtimeOnlyFieldsOf`,
  `runway validate`); packages/developer/repo-checks (`stackra validate --repository`); packages/runtime/outbox and
  packages/foundation/market-packs (tests only: their environment now comes from the runtime)
- **Public contract change**: `@stackra/config` exports `readEnvironment`, `isDeployedEnvironment`,
  `StackraEnvironment` (enum and type, also in its manifest's `schemas`), `PlatformEnvironment`, `ENVIRONMENT_VARIABLE`
  and `SAFETY_CRITICAL_VARIABLES`; `buildConfig` refuses a value for a field mapped to `STACKRA_ENVIRONMENT` and a
  `STACKRA_ENVIRONMENT` outside the closed list. `@stackra/app/server` exports `providePlatformEnvironment`, and its
  `createApp` boots with the reader's answer. `@stackra/gen` writes `environment.ts`. `@stackra/runway` exports
  `checkRuntimeOnlyConfig`, `runtimeOnlyFields`, the `RuntimeOnlyField` type and, from `./node`,
  `runtimeOnlyFieldsOf`; `runway validate` gains a finding. `@stackra/repo-checks`' `RunwayApi` gains two optional
  members.
- **Cross-service events**: none
- **Tenancy and data**: none; no schema or migration
- **Security and privacy**: closes a fail-open: a runway file or a typo can no longer make a deployment run as `dev`
  (memory stores, an unbound audit trail, dev sign-in). Refusals name the variable and the rule, never the value.
- **Secrets**: none
- **ADR needed**: no new ADR; amends ADR 0296 (2026-11-26 note)
- **New dependencies**: none
- **Deploy modes**: same in all three; a self-hosted image without infra metadata must set `STACKRA_ENVIRONMENT`
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/foundation/config/README.md (layers, the running environment),
  packages/runtime/app/README.md (boot), packages/developer/gen/README.md (Encore environment),
  packages/developer/runway/README.md (the two files, `runway validate`), ADR 0296 amendment, the changeset
- **Lane**: full
- **Change risk**: R3 (boot now refuses configurations and environments it used to accept; every generated Encore file
  gains an import)

## Compatibility and migration

- A runway `config` block or a test's `values` that sets a field mapped to `STACKRA_ENVIRONMENT` (today
  `outbox.relay_inbox.environment`, `market_packs.environment`) now fails boot with `ConfigInvalidError` and fails
  `runway validate`. Remove the value; set the variable on the runtime, or leave it unset on Encore Cloud.
- A `STACKRA_ENVIRONMENT` outside `dev`, `test`, `preview`, `staging`, `production` (`prod`, `Production`) now fails
  boot. An empty value still counts as unset.
- A deployed Encore service with no variable now runs as `production`, `preview` or `staging` (derived from the
  platform), where it read as `dev`. `dev` or `test` declared on a deployment, a value its platform contradicts, and a
  self-hosted image that reports no environment fail boot.
- `encore run` and `encore test` keep working with nothing set (`dev` and `test`).
- The pull requests that read the environment (stackra#1093, #1095, #1104; #1094 and #1098 for their memory defaults)
  rebase onto `readEnvironment` and `isDeployedEnvironment` and drop their own readers; stackra#1095's
  `provideRuntimeEnvironment` and its generated `environment.ts` are replaced by this change's.
- Regenerate with `stackra gen` so each service gets its `environment.ts`; the template picks it up with the release.

## Risks

- A self-hosted deployment whose image reports no metadata and sets no variable now fails boot instead of running as
  `dev`. That is the intended fail-closed answer; the message names the variable and the infra metadata to set.
- A deployment named something other than `preview`, `staging` or `production` (`qa`) runs as `staging` unless it
  declares otherwise; every deployed check applies to it.
- The runway check finds runtime-only fields from installed manifests: with `node_modules` absent it finds none, and
  the boot refusal is the backstop.
- The CLI's `--env` target selection (`databaseEnvironment`, `commandEnvironment`) keeps its own closed list of the same
  five names; it chooses a target, not the running environment.

## Acceptance criteria

- **AC-001**: THE `readEnvironment` SHALL return one of `StackraEnvironment` and read only `STACKRA_ENVIRONMENT` and the
  platform's report, never a configuration value.
- **AC-002**: IF `STACKRA_ENVIRONMENT` names no Stackra environment THEN THE reader SHALL refuse it with
  `ConfigInvalidError` naming the variable, never the value.
- **AC-003**: WHEN no platform reports, or the platform is `encore run` or `encore test`, THE reader SHALL read unset as
  `dev`, `dev` and `test`.
- **AC-004**: WHEN a deployed platform reports and the variable is unset THE reader SHALL derive the deployed
  environment, and IF the variable names `dev`, `test` or an environment the platform contradicts THEN it SHALL refuse.
- **AC-005**: IF a self-hosted image reports no metadata and the variable is unset THEN THE reader SHALL refuse
  instead of answering `dev`.
- **AC-006**: IF the values layer sets a field mapped to a safety-critical variable THEN THE `buildConfig` SHALL refuse
  it with `ConfigInvalidError` naming the field and the variable, and keep another field of the class a value.
- **AC-007**: WHEN the server `createApp` boots THE configuration SHALL see `STACKRA_ENVIRONMENT` as the reader's
  answer, given what `providePlatformEnvironment` recorded, and boot SHALL fail on a refusal.
- **AC-008**: WHEN gen runs for a service that runs `@stackra/app` THE generator SHALL write
  `stackra-encore/<member>/environment.ts` handing `appMeta().environment` to `providePlatformEnvironment`, and every
  generated Encore file SHALL import it first.
- **AC-009**: IF a runway `config` block sets a field that an installed manifest maps to a safety-critical variable THEN
  THE validator SHALL report it with the file and the path, in `runway validate` and `stackra validate --repository`.
- **AC-010**: THE `isDeployedEnvironment` SHALL be true for `preview`, `staging` and `production` only.

## Status history

- 2026-11-26 → Clarified (owner's go; the CTO's verdict; `encore test`'s report read in the container)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch; awaiting the CTO's approval)
