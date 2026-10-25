# Feature Specification: `@stackra/infra-mobile`, the mobile release infrastructure

**Feature Branch**: `figentra/sta-348-complete`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-590

**Linear project**: Figentra OS build (Track R: STA-72; gate C: STA-546)

**Clarifications status**: complete

**Input**: Build `@stackra/infra-mobile` (infrastructure category, ADR 0127 and 0171 decision 2): the mobile release
infrastructure of a repository (the EAS project and environments, the store records, the push credentials and the
signing), read from the root and mobile runways, for the Pulumi program `stackra infra gen` composes.

## Impact

- **Apps touched**: none (the mobile app's runway and `stackra.config.ts` are read by the caller, not changed)
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-mobile` (new member; the category folder is new)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none. The plan holds ids (EAS project, Apple team, App Store record, Play account, certificate
  fingerprint), never a secret value; signing certificates and push keys stay in EAS (`targets.eas.credentials:
eas-managed`, ADR 0173)
- **ADR needed**: no (ADR 0171 decisions 2 to 5, ADR 0127, ADR 0296, ADR 0344 decision 11)
- **New dependencies**: `@pulumi/pulumi` 3.268.0 (Apache-2.0) in a new `infra` catalog
- **Deploy modes**: same in all; a build-time and infra-time library, never in a runtime
- **Licence tier**: free (MIT; ADR 0171 decision 5 keeps mobile out of the Pro runtime stack)
- **Docs to update**: `packages/infrastructure/infra-mobile/README.md`, `packages/infrastructure/infra-mobile/AGENTS.md`
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract; reads runway and stack config only, creates no cloud resource)

## Clarifications

### Session 2026-10-25

- Which facts are root and which are member facts: the root runway holds the EAS account and project, the Apple team,
  the App Store Connect and Play ids and the signing mode (`providers.expo`, `providers.apple`, `providers.google`,
  `targets.eas`); the mobile member's runway holds its EAS profiles, store submission and per-environment profile and
  channel (ADR 0296 decisions 1 and 2, and the template's runways).
- `ref:` values resolve from the stacks repository's Pulumi stack config (ADR 0171 decision 4, 0289 decision 9).
- No Pulumi provider covers EAS, App Store Connect app records or Play apps, and EAS registers bundle ids, syncs
  capabilities and holds signing and push credentials itself, so those are owner steps (ADR 0344 decision 11) and the
  Pulumi slice creates no resource. Whether to manage EAS through its GraphQL API or Firebase through the Pulumi GCP
  provider is an owner question, outside this spec.

## User Scenarios & Testing

### User Story 1 - `stackra infra gen` builds the mobile plan from the runways (Priority: P1)

The CLI reads the root runway and the mobile member's runway and passes the member's bundle id, package and surface
bundle ids; it gets one plan with every environment that ships through EAS and the owner tasks, or every failure at
once.

**Independent Test**: `src/core/functions/__tests__/mobile-infra-plan.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's root and mobile runways, **When** `mobileInfraPlan` runs, **Then** the plan names the EAS
   account and project, the Apple team and App Store record, the Play account and fingerprint, the preview, staging
   and production releases with their profile, channel and EAS environment, and ten owner tasks with their config keys.
2. **Given** a missing provider fact, signing other than `eas-managed`, an environment without a profile, channel or
   EAS environment, two environments sharing one EAS environment, a surface outside the app's bundle id, no platform,
   or no environment shipping through EAS, **Then** it throws one `MobileInfraInvalidError` naming every path.

### User Story 2 - `pulumi preview` resolves and checks the mobile facts (Priority: P1)

Inside the generated program, `mobileStack(plan)` resolves each `ref:` from the stack config and returns the resolved
plan for the program to export.

**Independent Test**: `src/node/functions/__tests__/mobile-stack.function.test.ts` (Pulumi mocks).

**Acceptance Scenarios**:

1. **Given** the stack config holds every key, **Then** the resolved plan carries the ids.
2. **Given** a key is unset, **Then** the preview fails naming it; **given** a value of the wrong shape, **Then** it
   fails with a `MobileInfraInvalidError` naming the key.
3. **Then** no resource is registered.

## Requirements

- **FR-001**: Entries `.` (isomorphic, no Pulumi import) and `./node` (the Pulumi slice); one symbol per entry.
- **FR-002**: `mobileInfraPlan(root, app, identity)` reads the root runway's `providers.expo`, `providers.apple`,
  `providers.google`, `targets.eas.credentials` and each environment's mobile destination and channel, and the member
  runway's profiles, submission and per-environment profile and channel; it needs the App Store record only when iOS
  submits and the Play facts only when Android submits.
- **FR-003**: The plan refuses signing other than `eas-managed`, an EAS environment shared by two runway environments,
  and a surface bundle id outside the app's; the surfaces share `group.<bundleId>`.
- **FR-004**: The plan lists the owner tasks no API takes (`MobileOwnerStep`), each with its app and, for a `ref:`, the
  stack config key that holds its result.
- **FR-005**: `mobileStack(plan)` resolves every `ref:` fact from the stack config, checks each resolved fact's shape,
  and creates no resource.
- **FR-006**: No secret value is read or written; nothing calls a cloud.

## Success Criteria

- **SC-001**: The template's runways give a plan; every refusal names its path.
- **SC-002**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-003**: `pnpm verify` green for the member (run in the separate testing workflow).

## Out of scope

- The `stackra infra gen/preview` command that composes this package (cli).
- Syncing runway `vars` into EAS environments and creating a custom `staging` EAS environment (runway deploy step).
- `eas.json`, the Expo app config and the store checklist (gen).
- EAS resources through its GraphQL API, Firebase and FCM through the Pulumi GCP provider, and App Store Connect
  bundle ids: owner decisions.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · new package built in owner mode (develop now, test later)
