# Feature Specification: actions, app, gen: an action fails closed when no AuditTrail is bound outside dev and test

**Feature Branch**: `figentra/sta-1571-audit-fail-closed`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader (the CTO; a technical framework contract that enforces an existing ADR)

**Linear**: STA-1571

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: PR #1095. An action with no `AuditTrail` bound ran with no audit entry and no error, so a deployment that
left the audit driver out wrote unaudited. An unset `STACKRA_ENVIRONMENT` read as `dev`, nothing on the deploy path set
it, and Encore Cloud has no plain environment variables, so every deployed service counted as `dev`. This spec records
the contract change the PR makes in `@stackra/actions`, `@stackra/app` and `@stackra/gen` to hold ADR 0212 decisions 1
and 4 in code.

## Impact

- **Apps touched**: `apps/docs` (ADR 0212 note, `customers/security.mdx`)
- **Services touched**: none in this repository; every generated Encore service changes on its next `stackra gen`
- **Packages touched**: `packages/application/actions` (`@stackra/actions`), `packages/runtime/app` (`@stackra/app`),
  `packages/developer/gen` (`@stackra/gen`)
- **Public contract change**: additive exports, plus a behaviour change that fails closed. `@stackra/actions` exports
  `AuditConfig`, `AuditConfig$` and `AuditOptions` and lists the `actions.audit` config row and the
  `STACKRA_ENVIRONMENT` variable in its manifest; `ActionPipeline` now throws where it used to run unaudited.
  `@stackra/app/server` exports `provideRuntimeEnvironment`, `runningEnvironment` and the `RuntimeEnvironment` type;
  `createApp` now rejects boot on a deployed runtime set to `dev`, `test` or empty. `@stackra/gen` writes a new
  generated file `stackra-encore/<member>/environment.ts` and a new first import in every generated Encore file
- **Cross-service events**: none
- **Tenancy and data**: none (no table, no migration; the audit entry's shape is unchanged)
- **Security and privacy**: audit evidence becomes mandatory outside `dev` and `test` (ADR 0212 decisions 1 and 4); no
  new personal data; the error message names the environment and the drivers to bind, no input value
- **Secrets**: none
- **ADR needed**: no (implements ADR 0212 decisions 1 and 4; a dated note is added to ADR 0212)
- **New dependencies**: none (`encore.dev` is already a dependency of every generated Encore program)
- **Deploy modes**: same in all three; a self-hosted image counts as deployed when its infra config declares a cloud
  other than `local`
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/0212-audit-evidence-access-logs-hash-chain-and-retention.mdx`,
  `apps/docs/src/docs/customers/security.mdx`, `packages/application/actions/README.md`,
  `packages/runtime/app/README.md`, `packages/developer/gen/README.md`
- **Lane**: full
- **Change risk**: R2 (public contracts in three members; a security control that fails closed, so a reviewer may
  raise it)

## Discovery

- **Current behaviour**: `ActionPipeline.audited` read `this.optional(AuditTrail)` and, with none bound, ran the
  action and wrote nothing (SRC-001). `STACKRA_ENVIRONMENT` unset reads as `dev` everywhere it is read, and the server
  `createApp` passed `process.env` to boot unchanged (SRC-002). Gen's Encore files imported only `./database` ahead of
  the server app (SRC-003).
- **Topology**: `packages/application/actions/src/` (config, constants, schema, pipeline service, manifest);
  `packages/runtime/app/src/server/` (constant, two functions, a type, `createApp`, the barrel);
  `packages/developer/gen/src/core/` (a new emitter, a setup-imports helper, the seven Encore emitters,
  `pipelinePorts`, `GEN_REACHED_PORTS`, `generateMember`) and its golden fixtures (SRC-001, SRC-002, SRC-003).
- **Dependencies**: Encore's `appMeta().environment` (`name`, `type`, `cloud`) from `encore.dev` in the generated
  program only (SRC-004); `@stackra/config` (`Config`, `ConfigInvalidError`) and `@stackra/validation`
  (`Schema`, `registerSchemas`).
- **Ownership**: the Stackra framework maintainers own the three packages; the docs app owns the ADR note.
- **Constraints already decided**: ADR 0212 decisions 1 (every action audited) and 4 (evidence in the same
  transaction; fail closed); ADR 0124 and ADR 0091 (Encore stays in the generated program, never in a package);
  ADR 0014 decision 5 (the runtime provides what it owns); ADR 0170 decision 5 (the four environments); ADR 0294
  decisions 19 and 26 (config classes and a package's shipped `X$` schema) (SRC-005).

### Sources

- **SRC-001**: `packages/application/actions/src/core/services/action-pipeline.service.ts` on `origin/main`
  (`audited`, `optional(AuditTrail)`) and on the PR head (`trail()`, `AUDIT`); supports FR-001 to FR-004
- **SRC-002**: `packages/runtime/app/src/server/functions/create-app.function.ts` on `origin/main` and the PR head's
  `running-environment.function.ts` and `provide-runtime-environment.function.ts`; supports FR-005 and FR-006
- **SRC-003**: `packages/developer/gen/src/core/functions/` on the PR head: `emit-encore-environment.function.ts`,
  `encore-setup-imports.function.ts`, `pipeline-ports.function.ts`; supports FR-007 and FR-008
- **SRC-004**: Encore 1.58.8 run locally reports cloud `local` for `encore run` (type development) and `encore test`
  (type test), as recorded in PR #1095's test notes; supports FR-005
- **SRC-005**: ADR 0212 (decisions 1 and 4), ADR 0124, ADR 0091, ADR 0014, ADR 0170, ADR 0294 in
  `apps/docs/src/docs/adr/`; covers FR-001 to FR-008
- **SRC-006**: STA-1571 and PR #1095 (body, review notes and the four changesets)

## Glossary

- **Deployed runtime**: a serving runtime whose `cloud` is anything but `local`.
- **Local runtime**: `encore run` or `encore test` on a developer machine (`cloud` is `local`).
- **Running environment**: the value of `STACKRA_ENVIRONMENT` the configuration reads.

## User Scenarios & Testing

### User Story 1 - A deployment cannot write unaudited (Priority: P1)

An operator deploys a generated service to Encore Cloud and forgets to bind an audit driver. The first command action
is refused with an error that names the environment and the drivers to bind, instead of writing with no evidence.

**Why this priority**: it is the gap ADR 0212 decisions 1 and 4 close; without it audit evidence is optional in
production.

**Independent Test**: `create-app.environment.test.ts` boots a server app on a deployed runtime with no variable and
checks the action is refused.

**Acceptance Scenarios**:

1. **Given** a deployed runtime and no `AuditTrail`, **When** a command action runs, **Then** it is refused before any
   step runs.
2. **Given** a local runtime and no `AuditTrail`, **When** a command action runs, **Then** it runs as before.

### User Story 2 - A deployment cannot claim to be dev (Priority: P2)

An operator sets `STACKRA_ENVIRONMENT=dev` on a deployed service. Boot fails with `ConfigInvalidError`.

**Why this priority**: `dev` relaxes the audit check, so naming it in a deployment would reopen the gap.

**Independent Test**: `running-environment.function.test.ts` and `create-app.environment.test.ts`.

**Acceptance Scenarios**:

1. **Given** a deployed runtime, **When** the variable names `dev`, `test` or nothing, **Then** boot rejects.

### Edge Cases

- **EC-01**: a query runs with no trail in production: it is answered; this step audits command actions only.
- **EC-02**: a misspelt environment (`prod`): it is not `dev` or `test`, so a trail is required (fails closed).
- **EC-03**: a container that binds no `AuditConfig` (a hand-built test resolver, or a service gen has not
  regenerated): the old behaviour, no trail and no error.
- **EC-04**: a v2 service with an authored `src/main.ts` (STA-344) gets no `environment.ts`, so unset still means
  `dev` there; such a member is not an Encore app today.
- **EC-05**: a self-hosted image whose infra config leaves `metadata.cloud` at `local` reads as a local runtime.

## Requirements

### Functional Requirements

- **FR-001**: WHEN a command action runs with no `AuditTrail` bound and the bound `AuditConfig` names an environment
  other than `dev` or `test` THE `ActionPipeline` SHALL throw `AuditTrail is not bound in <environment>: ...` before
  any step runs. Sources: SRC-001, SRC-005
- **FR-002**: WHEN no `AuditConfig` is bound, or it names `dev` or `test`, THE `ActionPipeline` SHALL run a command
  action with no `AuditTrail` and write no entry. Sources: SRC-001
- **FR-003**: THE `AuditConfig` (key `actions.audit`) SHALL read `environment` from `STACKRA_ENVIRONMENT` with the
  default `dev`, and IF the value is empty THEN THE configuration SHALL refuse it at boot. Sources: SRC-001
- **FR-004**: WHEN a query runs THE `ActionPipeline` SHALL answer it whether or not an `AuditTrail` is bound.
  Sources: SRC-001
- **FR-005**: WHEN the server `createApp` boots after `provideRuntimeEnvironment` ran THE `createApp` SHALL set
  `STACKRA_ENVIRONMENT` for the configuration to `runningEnvironment(runtime, process.env)`: the variable when set and
  allowed; on a local runtime `dev`, or `test` for a test run; on a deployed runtime its name when that is `preview`,
  `staging` or `production`, else `production` for type production, `preview` for type ephemeral and `staging`
  otherwise. Sources: SRC-002, SRC-004
- **FR-006**: IF a deployed runtime sets `STACKRA_ENVIRONMENT` to `dev`, `test` or the empty string THEN THE
  `createApp` SHALL reject with `ConfigInvalidError`. Sources: SRC-002
- **FR-007**: WHEN gen generates a service with a root module and no authored `src/main.ts` THE gen SHALL write
  `stackra-encore/<member>/environment.ts`, which calls `provideRuntimeEnvironment(appMeta().environment)`, and every
  generated Encore file of that service SHALL import `./environment` first. Sources: SRC-003
- **FR-008**: WHEN a service declares an action or hosts a package that declares one THE gen SHALL add `AuditConfig`
  to the service's pipeline ports. Sources: SRC-003

### Non-functional Requirements

- **NFR-001**: THE change SHALL add no runtime dependency to any package. Sources: SRC-006

## Acceptance criteria

- **AC-001**: WHEN a command action runs with no `AuditTrail` bound and `AuditConfig.environment` is `production`, `staging`, `preview` or any name but `dev` or `test` THE `ActionPipeline` SHALL reject with `AuditTrail is not bound in <environment>` before the access check or the handler runs.
- **AC-002**: WHEN `AuditConfig.environment` is `dev` or `test`, or no `AuditConfig` is bound, THE `ActionPipeline` SHALL run the action with no `AuditTrail`.
- **AC-003**: WHEN a query runs with no `AuditTrail` bound in `production` THE `ActionPipeline` SHALL answer it.
- **AC-004**: WHEN an `AuditTrail` is bound in `production` THE `ActionPipeline` SHALL record one entry for a success and one for a refusal.
- **AC-005**: IF `STACKRA_ENVIRONMENT` is set to the empty string THEN THE `AuditConfig` SHALL refuse it at boot.
- **AC-006**: WHEN a deployed runtime sets no `STACKRA_ENVIRONMENT` THE `createApp` SHALL derive `preview`, `staging` or `production`, and a command action with no `AuditTrail` SHALL be refused.
- **AC-007**: IF a deployed runtime sets `STACKRA_ENVIRONMENT` to `dev`, `test` or the empty string THEN THE `createApp` SHALL reject boot with `ConfigInvalidError`.
- **AC-008**: WHEN the runtime is local THE `runningEnvironment` SHALL return the variable, else `dev`, or `test` for a test run, and WHEN no runtime was provided THE `runningEnvironment` SHALL return the variable unchanged.
- **AC-009**: WHEN gen runs for a service with a server entry THE gen SHALL write `environment.ts` and put `import "./environment";` before `import "./database";` in every Encore file, and SHALL write none for a package, an app or a service with an authored main.
- **AC-010**: WHEN a service declares or hosts an action THE `pipelinePorts` SHALL include `AuditConfig`, and WHEN it has no action THE `pipelinePorts` SHALL not.

## Success Criteria

- **SC-001**: 0 command actions run unaudited in a generated deployment with no `AuditTrail` bound, across the
  production, staging, preview and `prod` cases of `action-pipeline.audit.test.ts` — verified by: unit
- **SC-002**: a deployed runtime with no variable boots and refuses the unaudited action in 1 of 1 boot test, which
  fails on the commit before the change — verified by: unit
- **SC-003**: all 14 services with a server entry across the 12 changed golden fixtures get an `environment.ts`, and
  each of their generated Encore files imports `./environment` first — verified by: unit (goldens)

## Out of scope

- Auditing queries or sensitive reads (ADR 0212 decision 1's read audit stays with `@stackra/access-log`).
- A `src/main.ts`-authored service's environment (EC-04).
- Raising `@stackra/gen`'s dependency floor on `@stackra/app`; the changesets tell users to upgrade both.

## Assumptions

- Encore's `appMeta().environment.cloud` is `local` exactly for `encore run` and `encore test`, as observed on Encore
  1.58.8 (SRC-004).
- A container without an `AuditConfig` binding is a test resolver or an older generated wiring, and keeping its old
  behaviour is the compatible choice.

## Compatibility and migration

- **Callers of `ActionPipeline`**: no signature change. A deployed service with no `AuditTrail` now gets an error on
  every command action after it regenerates; before, it wrote unaudited. To upgrade: bind an `AuditTrail` driver
  (`outbox` from `@stackra/actions`, or `@stackra/access-log`'s `postgres`), upgrade `@stackra/app` and
  `@stackra/gen` together, run `stackra gen`.
- **Generated code**: every Encore file of a service with a server entry gains `import "./environment";` and the new
  `environment.ts`; `@stackra/gen` is a patch, but its output imports `provideRuntimeEnvironment` from the
  `@stackra/app` minor, so both must be upgraded together.
- **Operators**: set `STACKRA_ENVIRONMENT` only outside Encore; inside Encore it is derived. Setting `dev` or `test` on
  a deployed runtime now fails boot.
- **Older manifests**: gen links the `AuditConfig` row only when the declared `@stackra/actions` manifest lists it, so
  an older `@stackra/actions` gets no row and keeps its old behaviour.

## Risks

- A deployment that relied on running without an audit driver stops serving command actions on its next regenerate;
  the error names the drivers to bind.
- A self-hosted image that leaves its cloud at `local` still reads as `dev` (EC-05), documented in ADR 0212's note and
  `customers/security.mdx`.
- Version skew between `@stackra/gen` (patch) and `@stackra/app` (minor) fails the generated build at import time,
  which is loud, not silent.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 → Draft (written from the PR #1095 diff)
- 2026-11-26 → Clarified (no open question)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
