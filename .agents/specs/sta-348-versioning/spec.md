# Feature Specification: `@stackra/versioning` wave 4, dated versions and event changes

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/versioning` (communication, wave 4) for real: the `Change<Subject>({ from, sunset })` kind
base the template's two `*.change.ts` files extend, the transforms that serve an older version of a response or an
integration event, and the `Stackra-Version` resolution of ADR 0118 with its `Deprecation` and `Sunset` headers.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service and loyalty kit consume it once converted, STA-344)
- **Packages touched**: `packages/communication/versioning` (new member)
- **Cross-service events**: none; it converts integration event payloads between versions and publishes nothing
- **Tenancy and data**: none; the package stores nothing
- **Secrets**: none
- **ADR needed**: no (ADR 0118 as amended by 0294, the 0141 note and ADR 0305 rule 5 settle the shape)
- **New dependencies**: none outside the workspace; runtime edges to `@stackra/container`, `@stackra/contracts`,
  `@stackra/errors`, `@stackra/events` and `@stackra/validation`; dev dependencies from existing catalogs
- **Deploy modes**: same in all; no I/O and no clock read (the request time is passed in)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/communication/versioning/README.md`, `packages/communication/versioning/AGENTS.md`; ADR 0118, 0141, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract that every change file, the generated gateway and the outbox use)

## Clarifications

### Session 2026-10-24

The package follows the programming model v3.1 (ADR 0294, 0305) and the owner decisions of 2026-10-24. The choices
recorded when it was specified:

- The template's two change files are the consumer contract: both forms take `from`, a whole version for an event
  change and a `YYYY-MM-DD` day for a dated response change, as ADR 0305 rule 5 writes it. The `date` option of ADR
  0118's 2026-10-23 note is not accepted (open item below).
- Each change converts straight from and to its subject's current shape, as its types say (`down(view: OrderView)`,
  `up(v1): PointsEarned`), so one change serves one old version and no chain is walked.
- No `@stackra/actions` edge: nothing here needs it. The action context carries no version; the generated gateway
  resolves it with `resolveVersion` and shapes the output with `downgrade`.
- Build only what a consumer needs today: the kind base, the registry gen writes, the two transforms and the version
  resolution; no `./contracts`, `./testing` or `./node` entry.

## User Scenarios & Testing

### User Story 1 - Version an integration event (Priority: P1)

A kit author raises `PointsEarned` to `version: 2` and adds `PointsEarnedV1Change extends Change<PointsEarned>({ from:
1, sunset: "2027-04-01" })` beside it, with the v1 fields, `up` and `down`. A stored v1 row reads as v2 with
`upgrade`, and a v1 consumer gets `downgrade(PointsEarned, event, 1)`.

**Independent Test**: `src/core/bases/__tests__/change.base.test.ts`, `src/core/functions/__tests__/upgrade.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a v1 payload, **When** `upgrade(PointsEarned, payload, 1)` runs, **Then** the v1 schema checks it and a
   frozen `PointsEarned` of version 2 is returned.
2. **Given** an event change without `up`, **When** it is compiled, **Then** it fails.

### User Story 2 - Change a response by date (Priority: P1)

A service author adds `OrderView202703Change extends Change<OrderView>({ from: "2027-03-01", sunset: "2028-03-01" })`
with `down`; a caller pinned to 2026-10-01 receives the flat shape.

**Independent Test**: `src/core/functions/__tests__/downgrade.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** changes from 2027-03-01 and 2027-09-01, **When** `downgrade(OrderView, view, "2026-10-01")` runs,
   **Then** the 2027-03-01 change's `down` runs, once.
2. **Given** the newest version, **When** `downgrade` runs, **Then** the value itself is returned.

### User Story 3 - Resolve a request's version (Priority: P1)

The generated gateway passes the `Stackra-Version` header, the caller's pin, the service's supported dates and
fallback, and the request time to `resolveVersion`.

**Independent Test**: `src/core/functions/__tests__/resolve-version.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a header and a pin, **When** the version is resolved, **Then** the header wins; with no header the pin
   wins; with neither the fallback.
2. **Given** an older version, **When** it is resolved, **Then** `Deprecation` and `Sunset` are returned; for the
   newest, no header.
3. **Given** a version past its sunset, **When** it is resolved, **Then** `VersionSunsetError` is thrown.

### User Story 4 - Register what gen found (Priority: P2)

Gen reads each change's type argument and emits `registerChanges([[Subject, Change], ...])` beside the schemas.

**Independent Test**: `src/core/functions/__tests__/register-changes.function.test.ts`.

### Edge Cases

- A dated change whose `sunset` is not after its `from`: `RangeError` when the class is declared.
- An event change at or above its event's version, or on a domain event: refused at registration.
- An event version with no registered change (its sunset passed and the file was deleted): `RangeError`.
- An empty `Stackra-Version` header: refused as an unsupported version.
- A fallback outside `supported`: a `TypeError`, because it is the service's mistake, not the caller's.

## Requirements

- **FR-001**: The package SHALL be `@stackra/versioning` at `packages/communication/versioning`, `tier:lib`, entry `.`
  only, with runtime dependencies on workspace packages only.
- **FR-002**: It SHALL export `Change`, the one symbol the template imports, in the two forms the template writes:
  `Change<PointsEarned>({ from: 1, sunset })` with `up` and `down`, and `Change<OrderView>({ from: "2027-03-01",
sunset })` with `down`; a change SHALL be a shape built with the typed static `create`.
- **FR-003**: `Change` SHALL be called only, with the subject as the type argument; a missing type argument, a `from`
  of the wrong form, a subject of the wrong kind and an event change without `up` SHALL fail to compile, and bad option
  values SHALL throw when the class is declared.
- **FR-004**: `registerChanges` SHALL record `[Subject, Change]` pairs after checking the change kind, the subject
  kind, the event version and one change per `from`.
- **FR-005**: `downgrade` SHALL run at most one change's `down`, never mutate the value, and return the value itself
  when no change serves the version.
- **FR-006**: `upgrade` SHALL check an old event payload against its version's schema and lift it with that change's
  `up` to the current version.
- **FR-007**: `resolveVersion` SHALL take the header, then the pin, then the fallback; refuse a version the service
  does not serve with `UnsupportedVersionError` and one past its sunset with `VersionSunsetError`; and return
  `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) for an older version and no header for the newest.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package.

## Open items (for the owner, not blocking)

- ADR 0118's 2026-10-23 note names the dated option `date`; ADR 0305 rule 5 and the template write `from`. The package
  takes `from` only, so the 0118 note needs a one-line correction.
- ADR 0118 says "transform chain"; the v3.1 types make each change convert straight from the current shape. A note on
  0118 can record it.
- Gen must emit `registerChanges` beside `registerSchemas`, and the gen checks of 0118 and 0141 (a change date missing
  from the versioning config, a version bump with no change, a change past its sunset) stay planned (STA-340).
- The `Sunset` of a version is the earliest sunset among the dated changes after it, across every subject.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
