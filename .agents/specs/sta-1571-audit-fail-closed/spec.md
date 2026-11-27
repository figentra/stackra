# Feature Specification: actions, gen: an action fails closed when no AuditTrail is bound in a deployed environment

**Feature Branch**: `figentra/sta-1571-audit-fail-closed`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader (the CTO; a technical framework contract that enforces an existing ADR)

**Linear**: STA-1571

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: PR #1095. An action with no `AuditTrail` bound ran with no audit entry and no error, so a deployment that
left the audit driver out wrote unaudited. The CTO's verdict of 2026-11-26 sent the PR back: rebase it onto the one
environment reader of STA-2844 (merged as #1166) and close its fail-open exceptions: an unset environment counting as
`dev`, a container with no `AuditConfig`, a v2 service's authored `main.ts`, a self-hosted image counting as local, and
free-string typos; and raise gen's minimum `@stackra/app`. This spec records what the reworked PR builds in
`@stackra/actions` and `@stackra/gen` to hold ADR 0212 decisions 1 and 4 in code.

## Impact

- **Apps touched**: `apps/docs` (ADR 0212 note, `customers/security.mdx`)
- **Services touched**: none in this repository; every generated service that runs an action gets the `actions.audit`
  config row on its next `stackra gen`
- **Packages touched**: `packages/application/actions` (`@stackra/actions`), `packages/developer/gen` (`@stackra/gen`)
- **Public contract change**: `@stackra/actions` exports `AuditConfig`, `AuditConfig$` and `AuditOptions`, lists the
  `actions.audit` config row and the `STACKRA_ENVIRONMENT` variable (an enum of the five Stackra environments) in its
  manifest; `ActionPipeline` now throws where it used to run unaudited. `@stackra/gen` binds `AuditConfig` in a
  service's pipeline ports and gains two refusals (`authored_main_environment`, `app_version_floor`) and the
  `APP_ENVIRONMENT_FLOOR` constant. `@stackra/app` is unchanged by this PR: STA-2844's `providePlatformEnvironment`
  replaces the `provideRuntimeEnvironment` and `runningEnvironment` the first version of #1095 added.
- **Cross-service events**: none
- **Tenancy and data**: none (no table, no migration; the audit entry's shape is unchanged)
- **Security and privacy**: audit evidence becomes mandatory in every deployed environment (ADR 0212 decisions 1 and
  4); no new personal data; the error message names the environment and the drivers to bind, no input value
- **Secrets**: none
- **ADR needed**: no (implements ADR 0212 decisions 1 and 4 on ADR 0296's 2026-11-26 amendment; a dated note is
  added to ADR 0212)
- **New dependencies**: none (`@stackra/config` is already a dependency of `@stackra/actions`)
- **Deploy modes**: same in all three; a self-hosted image that reports no environment and sets no variable fails boot
  (STA-2844's reader), so it never counts as local
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/0212-audit-evidence-access-logs-hash-chain-and-retention.mdx`,
  `apps/docs/src/docs/customers/security.mdx`, `packages/application/actions/README.md`,
  `packages/developer/gen/README.md`, the changesets
- **Lane**: full
- **Change risk**: R2 (public contracts in two members; a security control that fails closed, so a reviewer may raise
  it)

## Discovery

- **Current behaviour**: `ActionPipeline.audited` read `this.optional(AuditTrail)` and, with none bound, ran the
  action and wrote nothing (SRC-001). Since STA-2844 the running environment has one reader, `readEnvironment` of
  `@stackra/config`, and the server `createApp` boots the configuration with its answer (SRC-002). Gen writes
  `stackra-encore/<member>/environment.ts` for a service that runs `@stackra/app` from the generated server entry, and
  none for a v2 service with an authored `src/main.ts` (SRC-003).
- **Topology**: `packages/application/actions/src/` (config, schema constant, options schema, pipeline service,
  manifest); `packages/developer/gen/src/core/` (`pipelinePorts`, `GEN_REACHED_PORTS`, the new
  `checkServerEnvironment`, `runsServerApp` and `APP_ENVIRONMENT_FLOOR`, `generateMember`, `emitEncoreEnvironment`) and
  `src/node/` (`generate`, the new `generatorVersion`), with the pipeline-ports golden (SRC-001, SRC-003).
- **Dependencies**: `@stackra/config` (`Config`, `ConfigInvalidError`, `readEnvironment`, `isDeployedEnvironment`,
  `StackraEnvironment`) and `@stackra/validation` (`Schema`, `registerSchemas`) (SRC-002).
- **Ownership**: the Stackra framework maintainers own both packages; the docs app owns the ADR note.
- **Constraints already decided**: ADR 0212 decisions 1 (every action audited) and 4 (evidence in the same
  transaction; fail closed); ADR 0296's 2026-11-26 amendment (the environment comes from the runtime only, one reader);
  ADR 0124 and ADR 0091 (Encore stays in the generated program); ADR 0294 decisions 19, 22 and 26 (config classes, a
  refusal carries its fix, a package's shipped `X$` schema) (SRC-004).

### Sources

- **SRC-001**: `packages/application/actions/src/core/services/action-pipeline.service.ts` on `origin/main`
  (`audited`, `optional(AuditTrail)`) and on the PR head (`trail()`, `environment()`); supports FR-001 to FR-005
- **SRC-002**: `packages/foundation/config/src/core/functions/read-environment.function.ts` and
  `packages/runtime/app/src/server/functions/create-app.function.ts` on `origin/main` (STA-2844, #1166); supports
  FR-002, FR-003, FR-005
- **SRC-003**: `packages/developer/gen/src/core/functions/emit-encore-environment.function.ts`,
  `pipeline-ports.function.ts` and `generate-member.function.ts`; supports FR-006 to FR-008
- **SRC-004**: ADR 0212 (decisions 1 and 4), ADR 0296 (amendment 2026-11-26), ADR 0124, ADR 0091, ADR 0294 in
  `apps/docs/src/docs/adr/`; covers FR-001 to FR-008
- **SRC-005**: STA-1571, PR #1095 and the CTO's spec verdicts of 2026-11-26 (the five fail-open exceptions and the gen
  floor); supports FR-002 to FR-008
- **SRC-006**: the `@stackra/app` release tags (`0.33.1` is the latest; STA-2844's minor changeset makes the next
  release `0.34.0`, the first with `providePlatformEnvironment`); supports FR-008

## Glossary

- **Deployed environment**: `preview`, `staging` or `production` (`isDeployedEnvironment`).
- **The one reader**: `readEnvironment(raw, platform?)` of `@stackra/config` (STA-2844).
- **v2 service**: a service with an authored `src/main.ts`, which gen writes no server entry or Encore environment for
  (STA-344).

## User Scenarios & Testing

### User Story 1 - A deployment cannot write unaudited (Priority: P1)

An operator deploys a generated service and forgets to bind an audit driver. The first command action is refused with
an error that names the environment and the drivers to bind, instead of writing with no evidence.

**Why this priority**: it is the gap ADR 0212 decisions 1 and 4 close; without it audit evidence is optional in
production.

**Independent Test**: `action-pipeline.audit.test.ts` runs a command action with no trail in each deployed
environment, from the bound config and from the runtime variable with no config bound.

**Acceptance Scenarios**:

1. **Given** a deployed environment and no `AuditTrail`, **When** a command action runs, **Then** it is refused before
   any step runs.
2. **Given** `dev` or `test` and no `AuditTrail`, **When** a command action runs, **Then** it runs as before.

### User Story 2 - Nothing but the runtime decides the environment (Priority: P1)

An operator misspells the environment (`prod`), sets it in a runway `config` block, or deploys a service whose wiring
was not regenerated or that boots from an authored `src/main.ts`. None of these runs actions unaudited: the misspelling
and the config value fail boot, the old wiring asks the one reader, and gen refuses the authored main.

**Why this priority**: each was a way to read a deployment as `dev`, the CTO's fail-open list.

**Independent Test**: `audit.config.test.ts`, `action-pipeline.audit.test.ts` and
`check-server-environment.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `STACKRA_ENVIRONMENT=prod`, **When** the service boots or a command action runs, **Then** it fails with
   `ConfigInvalidError`.
2. **Given** a v2 service that runs `@stackra/app`, **When** gen runs, **Then** it refuses with
   `authored_main_environment`.

### Edge Cases

- **EC-01**: a query runs with no trail in production: it is answered; this step audits command actions only.
- **EC-02**: a misspelt environment (`prod`, `Production`, `development`): refused at boot by `AuditConfig` and by the
  reader when the pipeline asks it, never read as some environment.
- **EC-03**: a container that binds no `AuditConfig` (a hand-built resolver, a wiring gen has not regenerated): the
  pipeline asks the one reader over the process environment, so a deployed runtime still needs a trail.
- **EC-04**: a v2 service with an authored `src/main.ts` that runs `@stackra/app`: gen refuses it, since no
  `environment.ts` would hand its platform to the reader.
- **EC-05**: a self-hosted image that reports no environment and sets no variable: the reader refuses it at boot
  (STA-2844 AC-005), so it never counts as local.
- **EC-06**: a process with no platform at all (vitest, a developer tool): unset reads as `dev`, as STA-2844 AC-003
  decides; no server entry boots that way, since every generated server loads `environment.ts` first.
- **EC-07**: an installed `@stackra/app` older than `0.34.0`: gen refuses with `app_version_floor`, never asking for a
  newer app than gen's own version.

## Requirements

### Functional Requirements

- **FR-001**: WHEN a command action runs with no `AuditTrail` bound in a deployed environment THE `ActionPipeline`
  SHALL throw `AuditTrail is not bound in <environment>: ...` before any step runs. Sources: SRC-001, SRC-004
- **FR-002**: THE `ActionPipeline` SHALL take the environment from the bound `AuditConfig` when it names one, else from
  `readEnvironment` over the process environment, and SHALL run a command action with no `AuditTrail` only in `dev`
  and `test`. Sources: SRC-001, SRC-002, SRC-005
- **FR-003**: THE `AuditConfig` (key `actions.audit`) SHALL read `environment` from `STACKRA_ENVIRONMENT` as one of
  `StackraEnvironment` with no default, and IF the value names no Stackra environment or comes from the values layer
  THEN THE configuration SHALL refuse it at boot. Sources: SRC-002, SRC-005
- **FR-004**: WHEN a query runs THE `ActionPipeline` SHALL answer it whether or not an `AuditTrail` is bound.
  Sources: SRC-001
- **FR-005**: IF the runtime's `STACKRA_ENVIRONMENT` names no Stackra environment and no `AuditConfig` names one THEN
  THE `ActionPipeline` SHALL reject a command action with `ConfigInvalidError`. Sources: SRC-002
- **FR-006**: WHEN a service declares an action or hosts a package that declares one THE gen SHALL add `AuditConfig`
  to the service's pipeline ports. Sources: SRC-003
- **FR-007**: IF a service runs `@stackra/app` from an authored `src/main.ts` THEN THE gen SHALL refuse it with
  `authored_main_environment` on the full pass. Sources: SRC-003, SRC-005
- **FR-008**: IF a service that runs `@stackra/app` has an installed `@stackra/app` older than the lower of
  `APP_ENVIRONMENT_FLOOR` and gen's own version THEN THE gen SHALL refuse it with `app_version_floor`. Sources:
  SRC-005, SRC-006

### Non-functional Requirements

- **NFR-001**: THE change SHALL add no runtime dependency to any package. Sources: SRC-005

## Acceptance criteria

- **AC-001**: WHEN a command action runs with no `AuditTrail` bound and the environment is `production`, `staging` or `preview` THE `ActionPipeline` SHALL reject with `AuditTrail is not bound in <environment>` before the access check or the handler runs.
- **AC-002**: WHEN the bound `AuditConfig` leaves the environment unset, or no `AuditConfig` is bound, THE `ActionPipeline` SHALL take the environment from `readEnvironment` over the process environment, refusing in a deployed one and running in `dev` or `test`.
- **AC-003**: WHEN a query runs with no `AuditTrail` bound in `production` THE `ActionPipeline` SHALL answer it.
- **AC-004**: WHEN an `AuditTrail` is bound in `production` THE `ActionPipeline` SHALL record one entry for a success and one for a refusal.
- **AC-005**: IF `STACKRA_ENVIRONMENT` is `prod`, `Production`, `development` or empty, or the environment is given as a value THEN THE `AuditConfig` SHALL refuse it at boot with `ConfigInvalidError`.
- **AC-006**: IF the runtime's `STACKRA_ENVIRONMENT` is misspelt and no `AuditConfig` is bound THEN THE `ActionPipeline` SHALL reject the action with `ConfigInvalidError` and run no handler.
- **AC-007**: WHEN a service declares or hosts an action THE `pipelinePorts` SHALL include `AuditConfig`, and WHEN it has no action THE `pipelinePorts` SHALL not.
- **AC-008**: IF a v2 service declares `@stackra/app` THEN THE generator SHALL refuse it with `authored_main_environment` naming `src/main.ts` and write no `environment.ts`.
- **AC-009**: IF the installed `@stackra/app` is older than the lower of `0.34.0` and gen's own version THEN THE generator SHALL refuse with `app_version_floor`, naming the version and the floor.

## Success Criteria

- **SC-001**: 0 command actions run unaudited with no `AuditTrail` bound across the production, staging and preview
  cases of `action-pipeline.audit.test.ts`, from the bound config and from the runtime variable alone — verified by:
  unit
- **SC-002**: 4 of 4 misspelt or empty names are refused by `AuditConfig`, and the misspelt runtime variable fails the
  action with 0 handler runs — verified by: unit
- **SC-003**: the revert check: with the pipeline change reverted, the no-config and unset-field tests of
  `action-pipeline.audit.test.ts` fail; with `checkServerEnvironment` dropped from `generateMember`, the v2 test of
  `generate.function.test.ts` fails — verified by: unit

## Out of scope

- Auditing queries or sensitive reads (ADR 0212 decision 1's read audit stays with `@stackra/access-log`).
- The reader's own rules (STA-2844), including `dev` for a process with no platform (EC-06).
- Binding an `AuditTrail` driver in the template and demo apps (STA-1583).

## Assumptions

- Every generated server loads `environment.ts` before the server app (STA-2844 AC-008), so only a process with no
  generated entry reaches the reader with no platform.
- `@stackra/*` packages are released together (`fixed` in `.changeset/config.json`), so gen's own version bounds the
  `@stackra/app` it can expect.

## Compatibility and migration

- **Callers of `ActionPipeline`**: no signature change. A deployed service with no `AuditTrail` now gets an error on
  every command action; before, it wrote unaudited. To upgrade: bind an `AuditTrail` driver (`outbox` from
  `@stackra/actions`, or `@stackra/access-log`'s `postgres`), upgrade every `@stackra/*` package together, run
  `stackra gen`.
- **Older wiring**: a service whose wiring binds no `AuditConfig` is no longer exempt: the pipeline reads the runtime
  environment through the reader.
- **Tests**: a test that runs actions with `STACKRA_ENVIRONMENT` set to a deployed name needs a trail bound.
- **v2 services**: one that runs `@stackra/app` from an authored `src/main.ts` must convert to the generated entry
  (delete `src/main.ts`, STA-344) or drop `@stackra/app`.
- **Version skew**: gen refuses an `@stackra/app` older than `0.34.0` (`app_version_floor`) instead of writing an
  `environment.ts` that fails at import.
- **Release order**: this change releases together with or after STA-1583, so the starter binds an `AuditTrail`
  before any deployed starter refuses unaudited actions. No code gate enforces the order; the release does.

## Risks

- A deployment that relied on running without an audit driver stops serving command actions; the error names the
  drivers to bind.
- A v2 service that runs `@stackra/app` stops generating until it converts; the refusal carries the fix.

## Open questions

None.

## Amendments

- 2026-11-27: reworked onto STA-2844 per the CTO's verdict of 2026-11-26. `provideRuntimeEnvironment`,
  `runningEnvironment` and `RuntimeEnvironment` are dropped from `@stackra/app` (the reader replaces them); the
  `UNAUDITED_ENVIRONMENTS` list and the `dev` default are dropped from `@stackra/actions`; a container with no
  `AuditConfig` now asks the reader; gen gains `authored_main_environment` and `app_version_floor`.

## Status history

- 2026-11-26 → Draft (written from the PR #1095 diff)
- 2026-11-26 → Clarified (no open question)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-27 → Clarified (the CTO's verdict of 2026-11-26: rebase onto STA-2844, close five exceptions, raise gen's
  floor)
- 2026-11-27 → Planned (plan.md, reworked)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
- 2026-11-27 → Tasked (tasks.md, reworked)
- 2026-11-27 → Implementing (built in this branch; awaiting the CTO's approval)
