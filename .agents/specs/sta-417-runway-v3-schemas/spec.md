# Feature Specification: Runway v3 schemas and the v3 TypeScript role presets

**Feature Branch**: `figentra/sta-417-runway-v3-schemas`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-417

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: The Stackra side of STA-417, written retroactively for PR figentra/stackra#136: the runway v3 schemas
(`tools/schemas/runway-root.schema.json`, `runway-service.schema.json`, `runway-app.schema.json`) per ADR 0296,
ADR 0299 decision 6 and ADR 0237, and the TypeScript presets of `@stackra/typescript-config` that the programming
model v3 roles extend. The consumer is figentra/stackra-template PR #16, which needs both.

## Impact

- **Apps touched**: `apps/docs` (a dated Note on ADR 0300 and its row in the ADR index)
- **Services touched**: none
- **Packages touched**: `packages/tooling/typescript` (`@stackra/typescript-config`: `library` preset, five new role presets, exports, README, `presets.test.ts`, a minor changeset)
- **Workers touched**: none (`workers/static` already publishes `tools/schemas/*.schema.json`; no change to it)
- **Repository files**: `tools/schemas/runway-root.schema.json`, `tools/schemas/runway-service.schema.json`, `tools/schemas/runway-app.schema.json`
- **Public contract change**: yes. The three runway schemas move to `version: 3`, and v2 runway files no longer validate against them. `@stackra/typescript-config` gains five exports and `library` gains the DOM libraries and `jsx: react-jsx`. All of it is additive for the preset's current users.
- **Cross-service events**: none
- **Tenancy and data**: none; no tenant data, no table, no migration
- **Security and privacy**: no runtime code. The schemas describe shape only and hold secret NAMES (`secrets`, `secrets.gateway`), never a value
- **Secrets**: no secret values. Runway files list secret names only, and the schemas refuse anything but a SCREAMING_SNAKE name
- **ADR needed**: no new ADR. A dated Note on ADR 0300 (2026-10-24, STA-417) records the `library` change and the five role presets. The schemas implement ADR 0296, ADR 0299 decision 6, ADR 0237 and ADR 0227 (allowed engines)
- **New dependencies**: none
- **Deploy modes**: build-time files, identical in saas, on-prem and air-gapped (see plan.md)
- **Licence tier**: no licence change. `@stackra/typescript-config` stays MIT and the schemas stay under the repository's MIT licence
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/adr/0300-published-tooling-presets-and-enforced-spell-checking.mdx` (dated Note), `apps/docs/src/adr/index.mdx` (the 0300 row), `packages/tooling/typescript/README.md` (preset table), and the `description` text inside the three schemas
- **Lane**: lite (recorded reason: retroactive spec for a change already written and reviewed on PR #136; the lead set the lite lane. Strictly, the ADR 0120 table would place this change in the full lane: change risk R2 and about 670 changed lines)
- **Change risk**: R2 (published contracts: the runway schemas served from the static host and consumed by the template, and new exports of a preset package; no auth, tenancy, money, PII or secret values)

## Clarifications

### Session 2026-10-24

These decisions were made before this spec was written. They come from the ADRs named and from the reviewed PR #136.

- Q: Which records govern the schema shape? → A: ADR 0296 (member `requires`, root topology groups), ADR 0299 decision 6 (the docs member has a runway, so `docs` joins the destinations), ADR 0237 (gateway secret names) and ADR 0227 (the engines a `requires` entry may name).
- Q: Does a member runway name its member? → A: No. The folder names the member, so the `member` field is gone from both member schemas.
- Q: Where do placement and sizes live? → A: In the root, per environment, under `topology` (`mode` monolith, grouped or split; `isolate`; `default`; `groups`). Each group carries members, cpu, memory, instances, scaling and a `workers` block (split, cpu, memory, instances). A grouped topology requires `groups`. The environment-level `isolate` moves into `topology.isolate`, and `encore.processAllocation` reads `from-topology`.
- Q: What leaves a service member's environments? → A: `deployable`, `isolate`, `resources`, `drivers` and the workers split, which are root facts now. `poolBudget` moves to `database.poolBudget`. `cache` gains `memoryMb`, `replicas` and `eviction`.
- Q: What do the root `defaults.service` keep? → A: `deployable`, `resources`, `poolBudget` and `drivers` are dropped. `database.poolBudget` and `config` are added.
- Q: How are secrets written? → A: A list of names in member runways (`secrets`) and in the root (`secrets.gateway`); never a value.
- Q: Which engines may `requires` name? → A: `postgres`, `valkey`, `s3` and `sns-sqs`, the engines ADR 0227 neither rejects nor defers. `dedicated: true` requires a one-line `reason`.
- Q: Must `instances` state both bounds? → A: Yes. `instances` requires `min` and `max`.
- Q: Do the new presets break ADR 0300 decision 1 (exactly five tooling packages)? → A: No. `service`, `mobile`, `tooling`, `desktop` and `service-worker` are exports of `@stackra/typescript-config`, not packages. A dated Note on ADR 0300 records this, and its index cell is updated.
- Q: Does `library` get the DOM libraries and JSX even for Node-only packages? → A: Yes: `lib: [ES2022, DOM, DOM.Iterable]` and `jsx: react-jsx`, so a package's `react` and `native` entries typecheck. The trade-off (Node-only packages see DOM types) is accepted. A `library-node` preset is added only if a real clash appears.
- Q: Which checks run before merge? → A: oxfmt, oxlint and validate (script tests, validate-repository, doc-standard, spec-trace, agents:check). The schemas were also checked with ajv 8.20.0 (draft 2020-12) against the template's seven runway files and eight negative cases. The preset tests, typecheck and build are written but not run, by owner direction 2026-10-24 (develop now, test later).
- Q: How are the schemas published? → A: By the existing `workers/static` build from `tools/schemas/*.schema.json` on push to main (`deploy-static.yml`). The first immutable release comes from the owner's `schemas@1.0.0` tag after merge.

## User Scenarios & Testing

### User Story 1 - A runway v3 file validates against its schema (Priority: P1)

A template or product author writes a root `runway.yaml` and member `runway.yaml` files in the v3 shape. Their
editor and `stackra validate` accept a correct file and refuse a v2 field or a broken v3 rule.

**Independent Test**: validate the template's seven runway files and the negative cases with ajv (draft 2020-12)
against the three schemas.

**Acceptance Scenarios**:

1. **Given** the template's root and member runway files, **When** they are validated, **Then** all seven pass.
2. **Given** a grouped topology without `groups`, a dedicated `requires` entry without a `reason`, or a member file
   with a `member` field, **When** it is validated, **Then** it is refused.

### User Story 2 - A v3 member extends its role preset (Priority: P1)

A member's `tsconfig.json` extends the `@stackra/typescript-config` preset named after its v3 role (`app`, `mobile`,
`library`, `service`, `tooling`), and gen-written programs extend `desktop` or `service-worker`. A package's `react`
and `native` entries compile under `library`.

**Independent Test**: `presets.test.ts` asserts that the role names are exported and that `library` sets
`jsx: react-jsx` and the DOM libraries.

**Acceptance Scenarios**:

1. **Given** the package exports, **When** a role name is resolved, **Then** it maps to a preset file.
2. **Given** a package with a `src/react/` entry that renders JSX, **When** it typechecks under `library`, **Then** no
   "Cannot use JSX unless --jsx" error appears.

### Edge Cases

- **EC-01**: A `monolith` or `split` topology needs no `groups`; only `grouped` requires them.
- **EC-02**: A `requires` entry without `dedicated: true` needs no `reason`.
- **EC-03**: A Node-only package that extends `library` sees DOM types; this is accepted until a real clash calls for a
  `library-node` preset.

## Requirements

- **FR-001**: THE root schema SHALL take `version: 3`, add `docs` to the per-environment destinations, take
  `secrets.gateway` as a list of secret names, require `min` and `max` on every `instances`, and reduce
  `defaults.service` to `database.poolBudget` and `config` (dropping `deployable`, `resources`, `poolBudget` and
  `drivers`).
- **FR-002**: THE root schema SHALL add a per-environment `topology` with `mode` (`monolith`, `grouped`, `split`),
  `isolate`, `default` and `groups`, where `grouped` requires `groups` and each group holds members, cpu, memory,
  instances, scaling and `workers` (split, cpu, memory, instances). The environment-level `isolate` SHALL move into
  `topology.isolate`, and `encore.processAllocation` SHALL read `from-topology`.
- **FR-003**: THE service and app member schemas SHALL take `version: 3` with no `member` field, take `secrets` as a
  list of names, and accept `requires` entries with `engine` (`postgres`, `valkey`, `s3`, `sns-sqs`), `dedicated` and
  `reason`, where `dedicated: true` requires a `reason`.
- **FR-004**: THE service member schema's environments SHALL drop `deployable`, `isolate`, `resources`, `drivers` and
  the workers split, move `poolBudget` to `database.poolBudget`, and give `cache` the `memoryMb`, `replicas` and
  `eviction` fields.
- **FR-005**: THE `library` preset SHALL set `lib: ["ES2022", "DOM", "DOM.Iterable"]` and `jsx: "react-jsx"`.
- **FR-006**: `@stackra/typescript-config` SHALL export the presets `service`, `mobile`, `tooling`, `desktop` and
  `service-worker` beside the existing ones, as files of the same package (ADR 0300 decision 1 holds).

## Success Criteria

- **SC-001**: The template's seven runway files pass and the eight negative cases are refused under ajv 8.20.0 (draft 2020-12) — verified by: manual
- **SC-002**: `presets.test.ts`, typecheck and build pass for `@stackra/typescript-config` — verified by: unit
- **SC-003**: After merge, the static host serves the v3 runway schemas, and the owner's `schemas@1.0.0` tag publishes the first immutable release — verified by: manual

## Out of scope

- `stackra validate` and the cross-file checks the schema descriptions name (every service placed in exactly one
  group; a member cannot undo `isolate`); the planned validator work owns them (STA-339).
- A `library-node` preset.
- Converting this repository's members to the new presets (STA-344).

## Assumptions

- `deploy-static.yml` already builds `workers/static` from `tools/schemas/*.schema.json` on push to main and on a
  `schemas@*` tag, so publishing needs no workflow change.
- figentra/stackra-template PR #16 is the first consumer of both the presets and the schemas.

## Status history

- 2026-10-24 · — → Draft · Claude (spec-writer) · retroactive, from STA-417 and PR #136 (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (spec-writer) · decisions recorded from the ADRs and the reviewed PR #136
- 2026-10-24 · Clarified → Planned · Claude (spec-writer)
- 2026-10-24 · Planned → Tasked · Claude (spec-writer)
- 2026-10-24 · Tasked → Implementing · Claude (spec-writer) · change written and reviewed; preset tests, typecheck and build not run yet (owner direction 2026-10-24)
