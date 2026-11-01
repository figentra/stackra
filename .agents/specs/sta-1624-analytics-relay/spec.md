# Feature Specification: analytics relay: apps send product analytics only to the analytics service

**Feature Branch**: `figentra/sta-1624-analytics-relay`

**Created**: 2026-10-30

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1624

**Linear project**: none

**Clarifications status**: complete

**Input**: Owner decision 2026-10-30 (STA-1623, ADR 0482 decision 5): apps send product analytics only to our
analytics service, through one relay driver in `@stackra/analytics`; the service fans out server-side to PostHog and
GA4 (Measurement Protocol). No Firebase Analytics SDK in the app, so the `AD_ID` block stays and there is no App
Tracking Transparency prompt. Decision record: ADR 0483, amending ADR 0298 decision 5 and ADR 0190 decisions 2 and 3.

## Impact

- **Apps touched**: none in core. App templates select the `relay` driver and set `ingestOrigin` to the public API
  origin by configuration (template line follow-up)
- **Services touched**: none in core. Figentra OS `services/analytics-reports` mounts the ingest action and the fan-out
  listener and binds the destinations (OS follow-up)
- **Packages touched**: `packages/cross-cutting/analytics` (contracts, core, native, node)
- **Cross-service events**: one outbox event of `@stackra/analytics`, `analytics.batch.accepted.v1`, written and
  consumed inside the analytics service
- **Tenancy and data**: no tables; the outbox row holds verified deliveries until the destination sent them. No tenant
  vocabulary (R-59). No personal data beyond the envelope's public ids (ADR 0071 decision 6)
- **Secrets**: names only. `ANALYTICS_POSTHOG_PERSONAL_API_KEY` (existing) is read by the service; the Pro `ga4`
  driver adds `ANALYTICS_GA4_API_SECRET`. The PostHog project key becomes a server value
- **ADR needed**: yes, ADR 0483 (this branch)
- **New dependencies**: none (`fetch`; `@stackra/actions`, `@stackra/consent`, `@stackra/events` are dependencies)
- **Deploy modes**: SaaS per region, as configured. On-prem and air-gapped: the default driver stays `none`; a host may
  run the ingest action with only a self-hosted PostHog
- **Licence tier**: free (relay, ingest, fan-out, `posthog`); `ga4` in Pro
- **Docs to update**: the package README and AGENTS; ADR 0483; forward Notes on ADR 0298 and 0190 (integration batch)
- **Lane**: full
- **Change risk**: R3 (PII boundary, outbound HTTP to vendors, server-side consent enforcement)

## Clarifications

### Session 2026-10-30

Owner (STA-1623 Q7, Q8 and the STA-1624 brief): one relay driver; fan-out server-side to PostHog and GA4 MP; no
Firebase Analytics SDK; `AD_ID` stays blocked; no ATT prompt; consent through the ADR 0472 snapshot; PostHog EU or
self-hosted per region, GA4 (ADR 0353); fan-out drivers in the analytics service (ADR 0190 decision 3).

Owner answers, 2026-10-30:

- Q1 → the `ga4` Measurement Protocol driver is an `AnalyticsDriver` of `@stackra-pro/analytics-destinations` (Pro
  repo follow-up; data-layer decision 22, ADR 0461).
- Q2 → GA4 is a destination in every region (owner, 2026-10-30, after separating Figentra's own product analytics
  from tenants' analytics). Configuration only. A tenant connecting its own Google Analytics property is out of scope:
  its own ADR and spec.
- Q3 → GA4 receives `client_id` (the anonymous id) only, never `user_id`; retention at GA4's shortest setting.
- Q4 → web apps use the same `relay` driver now (configuration only). Spec approved.

Builder choices, recorded for review:

- The relay posts envelope v2 unchanged, so every client rule (queue, lanes, retries, sampling, offline) holds.
- `ingestOrigin` is the public API origin for `relay`: the ingest action (`POST /analytics/batches`) and the consent
  endpoint (`POST /consent/snapshots`) sit behind the one generated gateway (ADR 0237), so no new config field.
- The pipeline already verifies the snapshot (`ctx.consent()`); the action reads it and never verifies again.
- One outbox event per granted destination, so a vendor that is down retries alone (the client's lane rule).
- A refusal answers counts, never an error, so the client never retries it.
- No server enrichment: the action has no request address, and forwarding one would be personal data.

## User Scenarios & Testing

### User Story 1 - An app's events reach the analytics service only (Priority: P1)

An app with `driver: "relay"` tracks `screen.viewed`. After the visitor grants `analytics`, the batch is posted to
`<ingestOrigin>/analytics/batches` with the `Stackra-Consent` header. No request goes to a vendor host.

**Acceptance**: the relay posts the deliveries unchanged with the consent header; a non-2xx answer rejects so the
client retries; the native relay buffers and flushes at 20 deliveries or on background.

### User Story 2 - The server applies the same consent decision (Priority: P1)

**Acceptance**: an unverified call consent publishes nothing and answers every delivery dropped; a delivery whose ids
are not the snapshot's subject is dropped; a destination gated by `marketing` gets nothing when only `analytics` is
granted; include and exclude apply to tracked events.

### User Story 3 - The service fans out per destination (Priority: P1)

**Acceptance**: each granted destination gets one `AnalyticsBatchAccepted`; its listener sends that batch to the
destination's driver once; an unknown destination rejects (dead-letters); `denyProperties` are removed.

### User Story 4 - Coarse device context replaces SDK properties (Priority: P2)

**Acceptance**: `context.device` (`os`, `osVersion`, `build`, `type`) maps in the PostHog driver to `$os`,
`$os_version`, `$app_build`, `$device_type`, with `appVersion` as `$app_version`; a relayed delivery (library
`@stackra/analytics/node`) carries `$geoip_disable`.

## Requirements

- **FR-001**: `relay` is a driver name of `AnalyticsDriver` (type and schema enum); `RelayAnalyticsDriver` in `.` posts
  `{ deliveries }` to `<ingestOrigin>/analytics/batches` with the header from `consentSnapshotHeaders` over
  `ConsentLedger.snapshotRequest(anonymousId)`; a missing `ingestOrigin` rejects as a configuration error.
- **FR-002**: `RelayAnalyticsDriver` in `./native` buffers as the native PostHog driver does (20, background, 1,000).
- **FR-003**: `AnalyticsContext` gains optional `device`; the delivery schema, the contracts test and the README
  envelope table change in the same commit.
- **FR-004**: `./node` ships `IngestAnalyticsBatchAction` (`analytics_batch.ingest`, public area, anonymous and user
  actors, `POST /analytics/batches`, not a tool): at most 100 deliveries, each matching the envelope schema; reads
  `ctx.consent()`; binds deliveries to the snapshot subject; strips `denyProperties`; publishes one
  `AnalyticsBatchAccepted` per destination whose category is granted and that takes at least one delivery; answers
  `{ accepted, dropped }`.
- **FR-005**: `./node` ships `FanOutAnalyticsListener`, which sends an `AnalyticsBatchAccepted` to its destination's
  driver (`default` → the bound driver, else `AnalyticsDriverLookup`).
- **FR-006**: nothing but the validated envelope reaches a driver.
- **FR-007**: the PostHog driver maps `context.device` and `appVersion` and turns GeoIP off for server-relayed batches.

## Success Criteria

- **SC-001**: with `relay` selected, a test sees one request per send, to the ingest path, with the consent header and
  no vendor key.
- **SC-002**: a test shows an unverified consent publishes nothing.
- **SC-003**: a two-destination test shows one event per granted destination, each sent only to its own driver.

## Out of scope (named, not built)

- The `ga4` driver (Pro repo), the OS analytics service wiring and runway secrets, template-line configuration, the
  edge `analyticsProxy` removal, the ATT and `AD_ID` manifest check (STA-1625).
- Session replay, heatmaps, surveys: dropped (ADR 0483 decision 6). Browser ad pixels: unchanged.

## Status history

- 2026-10-30 · — → Draft · Claude (builder) · spec and ADR 0483 written for owner approval
- 2026-10-30 · Draft → Clarified · owner · Q1, Q3, Q4 answered, spec approved; Q2 answered later the same day: GA4 in every region
- 2026-10-30 · Clarified → Implementing · Claude (builder) · plan and tasks; lanes for stackra-f4
