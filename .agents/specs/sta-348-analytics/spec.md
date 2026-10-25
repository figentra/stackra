# Feature Specification: `@stackra/analytics` wave 4: consent-gated delivery with a bounded pre-consent queue

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/analytics` (cross-cutting, wave 4) for real: delivery of `AnalyticsEvent` instances through
an `AnalyticsDriver` port, gated by the visitor's consent, with a bounded ordered queue for events fired before the
decision (ADR 0298). `AnalyticsEvent` itself stays in `@stackra/events` (ADR 0305 rule 20).

## Impact

- **Apps touched**: none. The template's web, console and mobile apps override `AnalyticsConfig`, call
  `useAnalytics().track(...)` and test with `fakeAnalytics()` (STA-344)
- **Services touched**: none
- **Packages touched**: `packages/cross-cutting/analytics` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables and no tenant vocabulary (R-59); events wait in memory only and carry the fields
  their schema declares, minus the configured deny list
- **Secrets**: none (vendor keys arrive with the vendor drivers, as public env values)
- **ADR needed**: no (ADR 0266, 0269, 0294, 0298, 0305, owner decision R-59 and the ADR 0127 2026-10-24 note)
- **New dependencies**: none new; `@stackra/config`, `@stackra/consent`, `@stackra/container`, `@stackra/contracts`,
  `@stackra/events`, `@stackra/validation` through `workspace:*`; `zod` through `catalog:`; `react` through
  `catalog:frontend` as an optional peer; `jsdom` and `@testing-library/*` (tests only) through `catalog:frontend`
- **Deploy modes**: same in all; the default `none` driver sends nothing, so on-prem and air-gapped need no network
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/cross-cutting/analytics/README.md`, `packages/cross-cutting/analytics/AGENTS.md`; ADR 0266, 0298, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (privacy behaviour: nothing may leave the device before consent; no stored server data)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24. The choices made when it was
specified:

- Registry v3.1 row: entries `.`, `./contracts`, `./react`, `./testing`; depends on events and consent; ADR 0298
  decisions 1, 2 and 5
- Launcher brief: the driver is a port with a `memory` driver in `./testing` only; vendor drivers come later
- Owner, R-59: no tenant vocabulary; this package attaches no scope or identity of its own
- Builder, recorded for review: a full queue drops the newest event, so the first view and the events before the
  answer survive (ADR 0298 consequence 1); the gating category may not be `necessary`; the `none` driver ships in `.`
  as the default, so a host that names no driver sends nothing

## User Scenarios & Testing

### User Story 1 - An event waits for the visitor's decision (Priority: P1)

The template's contact page tracks `LeadSubmitted` after a lead is accepted; before the visitor answers the banner it
waits, on acceptance it is sent in order, on refusal it is dropped.

**Independent Test**: `src/core/services/__tests__/analytics-client.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** no decision, **When** an event is tracked, **Then** nothing reaches the driver and `state` is `pending`.
2. **When** the visitor accepts, **Then** the queue is sent in its order, each event with its capture time.
3. **When** the visitor refuses, **Then** the queue is discarded unsent and later events are dropped.
4. **Given** `queueLimit` 2 and three events, **Then** the first two are kept.
5. **Given** Global Privacy Control, **Then** nothing is sent, even after an acceptance.

### User Story 2 - Only declared fields leave (Priority: P1)

**Independent Test**: `src/core/services/__tests__/analytics-client.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** `denyProperties: ["email", "phone"]`, **Then** an event's `email` field is removed before it is sent.
2. **Given** an instance with a field its schema does not declare, **Then** that field is not sent.
3. **Given** a domain event, **Then** `track` throws a `TypeError`.

### User Story 3 - A test reads what was tracked (Priority: P1)

The template's tests pass `fakeAnalytics()` to a render helper and read `events()`, `tracked` and `state`.

**Independent Test**: `src/testing/__tests__/analytics.fake.test.ts`,
`src/react/analytics/__tests__/use-analytics.test.tsx`.

**Acceptance Scenarios**:

1. **Given** `fakeAnalytics()`, **When** the code tracks `LeadSubmitted.create({ plan })`, **Then** `events()` and
   `tracked` equal `[LeadSubmitted.create({ plan })]`.
2. **When** the banner declines through the fake's `consent`, **Then** `state` is `opted_out`; when it allows, `opted_in`.

### User Story 4 - Configure delivery (Priority: P2)

A host overrides `AnalyticsConfig` (`driver`, `consentCategory`, `queueLimit`, the capture switches, `ingestOrigin`,
`denyProperties`); gen extends `AnalyticsConfig$` field by field.

**Independent Test**: `src/config/__tests__/analytics.config.test.ts`.

## Requirements

- **FR-001**: Four entries, `.`, `./contracts`, `./react`, `./testing` (registry row, ADR 0294 decision 15);
  `./contracts` imports no other entry.
- **FR-002**: `.` exports `AnalyticsConfig`, `AnalyticsConfig$` (the registry row) and `NoneAnalyticsDriver` (the gen
  wiring), with `AnalyticsClient`, `AnalyticsOptions`, `AnalyticsState` and the type `AnalyticsDriverName`.
- **FR-003**: `./contracts` exports `AnalyticsDriver` and the type `AnalyticsDelivery`; `./react` exports
  `useAnalytics`; `./testing` exports `fakeAnalytics`, `AnalyticsFake` and `MemoryAnalyticsDriver`.
- **FR-004**: Nothing is sent before the consent category is granted; undecided events wait in a queue of at most
  `queueLimit`, sent in order on acceptance and discarded on refusal; Global Privacy Control refuses (ADR 0298).
- **FR-005**: A delivery carries only the event's schema-declared fields minus `denyProperties`, its locked name and
  its capture time; `track` refuses anything that is not an analytics event.
- **FR-006**: The configuration defaults send nothing anywhere (`none` driver) and refuse `necessary` as the gating
  category.

## Success Criteria

- **SC-001** (template imports): `AnalyticsConfig` with `driver`, `consentCategory`, `autocapturePageviews`,
  `autocaptureClicks`, `webVitals`, `sessionReplay`, `cookieless`, `ingestOrigin`, `denyProperties` and
  `AnalyticsConfig$` with `.shape.<field>.unwrap().default(...)` from `.`; `AnalyticsDriver` from `./contracts`;
  `useAnalytics()` returning a client with `track` from `./react`; `fakeAnalytics()` returning an object with
  `events()`, `tracked` and `state` from `./testing`.
- **SC-002**: every public symbol has a test beside it; the barrel tests pin each entry's exports; the ADR 0298
  enforcement list (bound, order, discard, nothing before a decision, Global Privacy Control) is tested.
- **SC-003**: format, lint and the repository validator pass on the member (tests, typecheck and build run in the
  separate testing workflow).

## Out of scope (named, not built)

- Vendor drivers: `PosthogAnalyticsDriver` for `.` and `./native` (the template's gen wiring names them), with the
  `posthog` driver name and the `posthogKey` field the template's `EnvConfig` feeds.
- Attaching a principal or a `ScopeRef` to deliveries (the console's "user id only" events) and page-view capture: both
  belong with the vendor drivers.
- The render helpers that take `{ analytics }` (`@stackra/testing/react`, `@stackra/testing/native`).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · wave 4 of the STA-348 framework build (owner mode 2026-10-24: develop now, test later)
