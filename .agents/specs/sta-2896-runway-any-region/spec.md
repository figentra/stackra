# Feature Specification: an environment's region is any provider region; me, eu and ksa stay as presets; create asks

**Feature Branch**: `figentra/sta-2896-runway-any-region`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: leader (CTO; change risk R2, a public schema and two package exports widen)

**Linear**: STA-2896

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the Stackra production-readiness audit, batch 24 item 24.3: "Let Runway take any provider region, with me,
eu and ksa kept as named presets". A team in the US, India or APAC cannot say where its staging or production runs, and
`runway validate` says figentra/infra places it. This is a Runway fix for outside teams, allowed under the STA-2845
freeze.

## Impact

- **Apps touched**: apps/docs (ADR 0524 amendment, the `runway validate` page)
- **Services touched**: none
- **Packages touched**: packages/developer/runway (schema, checks, `resolveRegion`, `REGION_PRESETS`, canonical JSON schema copy, README), packages/developer/cli (`stackra create --region`, `placeRegion`, `starterRegion`), tools/schemas (`runway-root.schema.json`)
- **Public contract change**: additive and widening: `environments.<env>.region` goes from the enum `me | eu | ksa` to a lower-case string (`^[a-z][a-z0-9-]*[a-z0-9]$`) in the zod schema and `tools/schemas/runway-root.schema.json`; `resolveRegion(root, name): RunwayRegion | undefined` and `REGION_PRESETS` exported from `@stackra/runway`; `stackra create --region <name>`. Every runway that parsed before still parses; `RegionKey` keeps its three values.
- **Cross-service events**: none
- **Tenancy and data**: none (no tenant data; a runway file names where an environment runs)
- **Security and privacy**: none (no secret, account id or credential is read or written; a Google Cloud app still names its own project)
- **Secrets**: none
- **ADR needed**: yes: the ADR 0524 amendment of 2026-11-27 (proposed, in this change)
- **New dependencies**: none (`@stackra/runway` and `yaml` are already `@stackra/cli` dependencies)
- **Deploy modes**: same in all three (a runway file and a CLI question; nothing runs at deploy time that did not before)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: the `stackra create` terminal question "Where do staging and production run?"
- **Docs to update**: apps/docs/src/docs/adr/0524-cloud-estate-aws-organization-and-gcp-projects.mdx, apps/docs/src/docs/runway/validate.mdx, packages/developer/runway/README.md
- **Lane**: full
- **Change risk**: R2 (a public schema widens; validation messages change)

## Discovery

- **Current behaviour**: `ROOT_ENVIRONMENT_SCHEMA.region` is `z.enum(["me", "eu", "ksa"])`; `checkEnvironmentRegion`
  tells a product's staging or production without one to "Name the tenant region this environment lives in (me, eu or
  ksa); figentra/infra places it there", asks only `ksa` for a GCP project and refuses t4g or m6g caches only in `me`;
  `unusedCloudOptIns` counts only `me` and `eu` as AWS. `stackra create` never asks where the app runs, so a created app
  keeps the starter's `me-central-1` (SRC-001, SRC-002).
- **Topology**: `packages/developer/runway/src/core/` (enum, constants, functions, the `.` barrel) and the canonical
  JSON schema `tools/schemas/runway-root.schema.json` with its byte copy `schema/root.json`; the create path in
  `packages/developer/cli/src/node/commands/create.command.ts` and `src/node/create/functions/` (SRC-001, SRC-003).
- **Dependencies**: `yaml`'s document API (comments kept) for the runway rewrite (SRC-003).
- **Ownership**: `@stackra/runway` and `@stackra/cli` are developer packages owned by the core maintainers; ADR 0524 by
  the leader (SRC-004).
- **Constraints already decided**: ADR 0524 (Figentra's estate: one account or project per product; figentra/infra
  places it); OS ADR 0001 (Figentra's tenant regions; a new key needs an amendment); ADR 0354 decision 4 (the root
  `regions` and each environment's deploy list); ADR 0515 decision 3 (create asks, every question a flag, `--yes` takes
  the defaults); STA-2845 (the runway freeze admits fixes for outside teams) (SRC-004).

### Sources

- **SRC-001**: `packages/developer/runway/src/core/enums/region-key.enum.ts`, `src/core/constants/root-environment-schema.constant.ts`, `src/core/functions/check-environment-region.function.ts`, `src/core/functions/unused-cloud-opt-ins.function.ts` on `origin/main` (FR-001 to FR-006)
- **SRC-002**: stackra-template `starter/minimal/root-runway.yaml` on `origin/main` (`providers.aws.region: me-central-1`, `regions.me`) and template PR #59 (adds `region: me`) (FR-007 to FR-009)
- **SRC-003**: `packages/developer/cli/src/node/commands/create.command.ts` and `src/node/create/functions/starter-files.function.ts` on `origin/main` (FR-007 to FR-009)
- **SRC-004**: ADR 0524, ADR 0354, ADR 0515 in `apps/docs/src/docs/adr/`; OS ADR 0001; Linear STA-2845 (FR-001 to FR-009)
- **SRC-005**: the readiness audit, batch 24 item 24.3, and Linear STA-2896 (FR-001 to FR-009)

## Glossary

- **Preset**: one of `me`, `eu`, `ksa`, Figentra's tenant regions, each standing for a fixed cloud region (`REGION_PRESETS`).
- **Provider region id**: an AWS region id (`us-east-1`, `us-gov-west-1`) or a Google Cloud one (`europe-west1`).
- **Resolve**: turn a region name into its cloud and location: a `regions` key first, then a preset, then a provider id.

## User Scenarios & Testing

### User Story 1 - A team outside Figentra names its own region (Priority: P1)

A team in the US writes `region: us-east-1` on staging and production (or `europe-west1` with its own GCP project) and
`runway validate` passes without mentioning figentra/infra.

**Why this priority**: without it no team outside the Figentra estate can describe where its app runs.

**Independent Test**: `parse-runway-estate.function.test.ts` and `resolve-region.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a product runway whose staging and production name `us-east-1` and `ap-south-1`, **When** `runway
validate` runs, **Then** it reports no region finding.
2. **Given** an environment that names `us`, which no `regions` key, preset or provider id matches, **When** `runway
validate` runs, **Then** it reports `"us" is not a region Runway knows` with the three forms.

### User Story 2 - `stackra create` asks where the app runs (Priority: P1)

A developer runs `stackra create acme --region us-east-1` (or answers the question) and the new app's root runway places
staging and production in us-east-1, with its comments kept.

**Why this priority**: the created app should belong to its owner's region from the first commit.

**Independent Test**: `place-region.test.ts` and `create.command.test.ts`.

**Acceptance Scenarios**:

1. **Given** the starter placed in `me`, **When** `stackra create app --region us-east-1` runs, **Then** staging and
   production name `region: us-east-1`, every deploy list is `[us-east-1]`, the root `regions` declares only
   `us-east-1` on aws, and nothing names me-central-1.
2. **Given** `--yes` and no `--region`, **When** `stackra create` runs, **Then** the starter's region is kept, named as staging's and production's `region`, and the runway passes `checkEnvironmentRegion`.

### Edge Cases

- **EC-01**: a `regions` key named like a preset (`me` on me-south-1): the declared key wins.
- **EC-02**: a Google Cloud region with no project: `runway validate` asks for `providers.gcp.projects` (or the
  figentra/infra opt-in); `stackra create` writes no project id, so the developer names it.
- **EC-03**: a cache class t4g or m6g in an environment at `me-central-1` named by id rather than preset: refused.
- **EC-04**: `--region us`: refused before any file is written.

## Requirements

### Functional Requirements

- **FR-001**: THE root runway schema SHALL take `environments.<env>.region` as a lower-case string matching `^[a-z][a-z0-9-]*[a-z0-9]$`, in zod and in the canonical JSON schema. Sources: SRC-001, SRC-004
- **FR-002**: THE `resolveRegion(root, name)` function SHALL resolve a key of `root.regions` first, then a preset (`REGION_PRESETS`), then an AWS or Google Cloud region id to itself on its cloud, and answer `undefined` otherwise. Sources: SRC-001, SRC-004
- **FR-003**: WHEN a product's staging or production names no region THE `checkEnvironmentRegion` check SHALL name the three forms and SHALL NOT name figentra/infra. Sources: SRC-001, SRC-005
- **FR-004**: IF an environment's `region` resolves to nothing THEN `checkEnvironmentRegion` SHALL report it at `environments.<env>.region`. Sources: SRC-001
- **FR-005**: WHEN an environment resolves to Google Cloud and the runway has neither `providers.gcp.projects` entries nor `providers.gcp.project: true` THE check SHALL ask for a project; and WHEN an environment resolves to `me-central-1` with a t4g or m6g cache class THE check SHALL refuse it. Sources: SRC-001
- **FR-006**: THE `unusedCloudOptIns` check SHALL count an environment as on AWS when its region resolves to aws. Sources: SRC-001
- **FR-007**: THE `stackra create` command SHALL take `--region` and, when interactive and not given, ask "Where do staging and production run?" with the starter's region as the default, accepting only a name `resolveRegion` resolves. Sources: SRC-003, SRC-004
- **FR-008**: THE command SHALL rewrite the root runway with `placeRegion` for the chosen region, the starter's own included: staging's and production's `region`, every environment's `regions`, the root `regions` entry (dropping keys nothing lists), `targets.encore-cloud.cloud` and the deprecated `providers.aws.region`, keeping comments. Sources: SRC-002, SRC-003
- **FR-009**: IF `--region` names no region THEN the command SHALL refuse before writing any file; WHEN `--yes` is given without `--region` THE starter's region SHALL be kept and written as staging's and production's `region`. Sources: SRC-003, SRC-004

### Non-functional Requirements

- **NFR-001**: THE rewrite SHALL keep every comment of the root runway and write flow lists unpadded (`[us-east-1]`), as the starter does. Sources: SRC-002
- **NFR-002**: NO account id, project id or credential SHALL be written by `stackra create`. Sources: SRC-004

### Key Entities

- **Resolved region**: `RunwayRegion` (`key`, `cloud`, `location`, optional `account`, `jurisdiction`).

## Acceptance criteria

- **AC-001**: WHEN staging and production name AWS region ids THE region check SHALL report nothing.
- **AC-002**: WHEN an environment names a Google Cloud region id and the runway names a project THE region check SHALL report nothing; without a project it SHALL report the environment.
- **AC-003**: IF a region resolves to nothing THEN THE region check SHALL report `"<name>" is not a region Runway knows`.
- **AC-004**: WHEN a region is missing THE message SHALL name `us-east-1` and SHALL NOT contain `figentra/infra`.
- **AC-005**: WHEN `stackra create --region us-east-1` runs THE written runway SHALL place staging and production in `us-east-1` and pass `checkEnvironmentRegion` and `checkRegions`.
- **AC-006**: WHEN `stackra create --yes` runs without `--region`, or `--region` or the question's default names the starter's own region, THE written runway SHALL keep that region, name it as staging's and production's `region` and pass `checkEnvironmentRegion`.
- **AC-007**: IF `--region us` is given THEN THE `stackra create` command SHALL exit 1 and write no folder.

## Success Criteria

- **SC-001**: every runway that parsed on `origin/main` still parses (the existing estate, deploy and region tests pass unchanged) — verified by: unit (`parse-runway-estate`, `deploy-targets`, `environment-sizes-of`)
- **SC-002**: a created app placed in `us-east-1` passes the runway region checks with no edit — verified by: unit (`place-region.test.ts`)

## Out of scope

- Removing Figentra's other furniture from the starter (`providers.aws.accounts`, `providers.infisical`): other batch 24 items.
- Updating the starter's comments in stackra-template (template PR #59 adds `region: me` with the old wording).
- Checking that a provider account has a region enabled (the provider's answer at deploy time).

## Assumptions

- AWS and Google Cloud are the only clouds Runway names (`RunwayCloud`); an Azure region is refused until one is added.
- New AWS and Google Cloud regions keep their published id shapes (`<area>-<direction>-<n>`, `<continent>-<direction><n>`).

## Amendments

None.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the readiness audit item 24.3 and the built change
- 2026-11-27 · Draft → Clarified · spec author · questions answered from ADR 0524, ADR 0515 and OS ADR 0001
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
