# Feature Specification: analytics routing across the tenant tree: connected tools at every level, sent from the integrations service

**Feature Branch**: `figentra/sta-1628-tenant-ga4-destination`

**Created**: 2026-10-30

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1628

**Linear project**: none

**Clarifications status**: complete

**Input**: Owner request, 2026-10-30: tenants see their own analytics in their own tools. Widened the same day: every
analytics or ad tool (PostHog, GA4, Firebase, Meta, TikTok and others) is a connector of the integrations service,
offered to tenants at every level of the recursive tree; Figentra and the levels above a tenant see transactions from
everywhere; and no tenant finds its tools short of data without knowing why. Builds on ADR 0483 (STA-1624, unlanded
branch `figentra/sta-1624-analytics-relay`). Decision record: ADR 0485 (Accepted, this branch). The branch and folder
keep the first name (GA4 only); the scope is the whole routing.

## Impact

- **Apps touched**: none in core. Template lines: the console's connection pages, the per-connection health page, the
  sharing level on the organisation join flow, and the tenant surface's consent banner listing recipients (template
  line follow-ups)
- **Services touched**: none in core. Figentra OS follow-ups:
  - `services/analytics-reports`: routing, the connection and sharing-level projections, conversions from business
    events, drop summaries, reconciliation, Figentra's in-region platform warehouse and self-hosted PostHog per region.
  - The OS integrations service: vendor connectors, sends, the recipients ledger, erasure, the replay store, alerts and
    the health page.
  - OS tenancy: the sharing level on each parent-child link.
  - Commerce and payments: no change; their existing integration events are mapped to conversions.
- **Packages touched**:
  - `packages/cross-cutting/analytics` (`./contracts`, `./node`): the route computation, `AnalyticsDeliveryRouted`,
    `AnalyticsRouteSummarised`, the projections' shapes and the conversion mapping.
  - `packages/communication/integrations`: the `AnalyticsToolConnector` port (`ConnectorKind.Analytics`), an optional
    `erasePerson` and the `canErase` declaration on `AdPlatformConnector`, the recipients ledger contract, the replay
    contract, and `ConversionBridge` taking routed conversions.
  - No vendor code in Stackra (ADR 0443 decision 8).
- **Cross-service events** (all within one region):
  - New `analytics.delivery.routed.v1`: analytics to integrations, one per connection.
  - New `analytics.route.summarised.v1`: analytics to integrations, hourly drop counts per connection.
  - Connection lifecycle events from integrations to analytics (connector key, kind, owning scope, category,
    `canErase`, `phoneFormat`; no secret). Whether they exist today is checked at plan.
  - Sharing-level changes from tenancy to analytics.
  - Existing business events (`OrderPlaced` and the payment and refund events) consumed by analytics.
- **Tenancy and data**: tenant-owned data that crosses tenants by rule.
  - **Route.** The route is computed only from the request context and records (ADR 0485 decision 3), never from an
    envelope id.
  - **Tables.**
    - Analytics projections: connections per scope, sharing levels.
    - Integrations: recipients ledger (subject public id, connection, first and last sent), replay store (encrypted,
      region, window), health counters.
  - **Isolation.** RLS on each. No identifier with `tenant` outside `@stackra/tenancy` (ADR 0323). The isolation test
    (`security-tenancy-isolation-test`) is required: a tenant outside the route never receives an event, and an
    ancestor at `aggregates` or `none` never receives one.
  - **Classification.** Match keys are a classified field of the routed event (ADR 0134).
- **Secrets**: names only, all tenant secrets in the connection store, declared on each OS connector's `Connection`
  (for example `GA4_API_SECRET`, `META_CAPI_ACCESS_TOKEN`, `TIKTOK_EVENTS_ACCESS_TOKEN`, plus OAuth grants for erasure
  APIs). They are written blind, never read back and never in Infisical. The deployment's own
  `ANALYTICS_GA4_API_SECRET` and `ANALYTICS_POSTHOG_PERSONAL_API_KEY` (ADR 0483) are unchanged
- **ADR needed**: yes, ADR 0485 (this branch, Accepted); it amends ADR 0210 decision 1, ADR 0243 decision 7 and ADR
  0483 decision 5
- **New dependencies**: none expected. Whether `@stackra/analytics` may depend on `@stackra/integrations` for
  `matchKeysOf` (or the hashing moves to `@stackra/contracts`) is checked at plan; no catalog change
- **Deploy modes**: SaaS in every region, each connector lockable off per region or plan (ADR 0485 decision 11).
  On-prem: routing runs, connectors as the install allows. Air-gapped: no external connector; routing to in-install
  tools only
- **Licence tier**: free for the routing (`@stackra/analytics/node`) and the ports and machinery
  (`@stackra/integrations`); vendor connectors are OS integrations code, not a Stackra package (ADR 0443 decision 7).
  Figentra plan entitlement `analytics.connectors`, off on every plan until the owner sets it (Q3)
- **Privacy**:
  - Roles: the tenant is controller, Figentra its processor and also a controller for named purposes of its own
    (platform terms).
  - Documents: the DPA, the record of processing, the platform terms, the organisation join terms and the tenant
    surface banner change before release.
  - Contacts: only hashed, only to connectors that can erase, only with `marketing`.
- **Docs to update**: ADR 0485; the analytics and integrations package READMEs; the DPA and privacy templates (ADR 0071
  decision 5); forward Notes on ADR 0210, 0243, 0483 and the ADR index row and nav (integration batch)
- **Lane**: full
- **Change risk**: R3 (tenancy and cross-tenant flow, tenant secrets, PII, outbound HTTP to tenant-chosen vendors,
  consent, erasure)

## Clarifications

### Session 2026-10-30 (first)

The first draft covered one tenant's GA4 only. Its decisions that survive are in ADR 0485 decisions 5 (secrets
written blind, never read back) and 12 (not the built-in dashboards). Its open questions Q1 (Google's role), Q4
(which events), Q5 (`user_id`) and Q6 (scope level) are settled or replaced by the answers below.

### Owner answers, 2026-10-30 (second session: routing across the tenant tree)

The owner widened the scope: every connector (PostHog, GA4, Firebase, Meta, TikTok and others) lives in the
integrations service and is offered to tenants at every level of the tree; Figentra and each level above must see
transactions from everywhere. Answers:

- **Roll-up.** Full event-level detail goes to the parties (the tenant whose surface it happened on, and the seller)
  and to every organisation ancestor (ADR 0243). Other ancestors (host, reseller) get full detail only if the child
  agreed at join, otherwise aggregates. Disclosed in each child's settings.
- **Figentra's view.** Full event level across all tenants, with a dual role like Shopify's: processor of tenant data in
  general, and controller for named purposes of its own (platform analytics, fraud, billing, product improvement),
  stated in the platform terms. That data stays in each region (Figentra's warehouse and a self-hosted PostHog per
  region). Figentra's global tools (PostHog EU, GA4) get events without hashed contacts.
- **Payload to tenant connectors.** Behaviour, conversions and hashed contact data. Contacts go only to connectors
  where we can carry out an erasure; the others get behaviour and conversions without contacts.
- **Routing.** The analytics service checks consent and decides which connections get which events, then publishes
  one event per connection. The integrations service owns the connector, its credentials and the vendor call.
- **Delivery guarantees.** All four: a health page per connection, a replay window, alerts on failure, and a daily
  reconciliation report.

Builder choices, recorded for review (ADR 0485 states them):

- **Aggregates** for non-detail ancestors are served by the built-in dashboards and the warehouse, never pushed to
  their vendor tools.
- **Regions.** A route never crosses a region; an ancestor in another region gets aggregates only (ADR 0353).
- **Match keys** are hashed in memory by the analytics service with the existing `matchKeysOf`, with the
  destination connection's `phoneFormat`. Raw contacts are never stored or put on the bus. A conversion with match
  keys needs `marketing` in the event's snapshot, as `ConversionBridge` does today; an audience upload also needs the
  person's stored proof (ADR 0472 decision 5). In the second session the owner's wording was "a per-person stored
  consent proof" for contacts; Q6 settled it: both.
- **Behaviour envelope.** It never carries contacts, IP, user agent or advertising id, so ADR 0483 holds for clients.
- **Erasure capability.** `canErase` is declared per connector and proven by a recorded case. No vendor is assumed
  capable; GA4 through the Measurement Protocol alone is not.

### Owner answers to Q1 to Q7, 2026-10-30

The owner answered "go with all", relayed verbatim by the leader session: the recommended answer where one was
proposed, and the most conservative choice, marked changeable, where none was.

- **Q1 — Replay window**: 7 days, encrypted, in region. Changeable.
- **Q2 — Figentra's own destinations**: yes. Figentra's PostHog and GA4 of ADR 0483 become platform-level connections
  of the integrations service, in a follow-up ADR that amends ADR 0483 decision 4 and the `analytics-destinations` row
  of ADR 0461; ADR 0483 holds until then (ADR 0485 decision 14).
- **Q3 — Plans**: conservative. The entitlement `analytics.connectors` (connectors, replay and reconciliation) is off on
  every plan until the owner switches it on per plan in the console, with a limit on connections per tenant.
  Changeable.
- **Q4 — Firebase**: conservative. No Firebase connector; a tenant measuring an app connects GA4. Changeable.
- **Q5 — IP and user agent**: conservative. Never on conversions, as ADR 0483 decision 3 says for behaviour. Changeable.
- **Q6 — Consent for match keys**: conservative. `marketing` in the event's snapshot and the person's stored consent
  proof (ADR 0472 decision 5), for every conversion and audience upload with match keys. Changeable.
- **Q7 — Legal**: every connector starts locked off in the GCC region until legal review of the KSA and UAE PDPL
  transfer rules and of Figentra's controller purposes in the platform terms; that review is a release condition in
  every region.

## User Scenarios & Testing

### User Story 1 - A tenant at any level connects a tool (Priority: P1)

A tenant admin at any depth opens Integrations, picks GA4, Meta or another analytics or ad connector, enters its
credentials and the consent category, and saves.

**Acceptance**: the connection is created at the tenant or scope level in the integrations service; no secret is
returned by any read, list, export, log or error; the console states whether the connector can erase and therefore
whether it receives match keys; the analytics service's projection shows the connection without any secret; an
entitlement or region lock refuses with a typed refusal.

### User Story 2 - The route reaches every recipient the rules allow (Priority: P1)

A shopper on a marketplace storefront (host tenant H, organisation parent O of seller S) buys from S.

**Acceptance**: S (seller) and the storefront owner receive full detail; O receives full detail through its
organisation membership; a reseller ancestor at `aggregates` receives nothing in its tools and sees totals in its
dashboard; an ancestor in another region receives nothing; Figentra's regional warehouse and PostHog receive the event
with match keys absent; Figentra's global tools receive it without contacts.

### User Story 3 - Consent and payload per connection (Priority: P1)

**Acceptance**: a behaviour event reaches only connections whose category the snapshot grants; match keys reach only
`canErase` connections and only with `marketing`; a behaviour event never carries a contact field, IP, user agent or
advertising id; one routed event is published per connection.

### User Story 4 - A tenant always knows why (Priority: P1)

**Acceptance**: the health page shows sent, dropped by consent (by reason), sent without match keys (by reason),
failed and the last error; a replay re-sends a time range with the same event ids; repeated failures or a rejected
credential alert the tenant's admins; the daily reconciliation sets ledger orders and revenue against routed and sent
counts, by reason.

### User Story 5 - Erasure and leaving (Priority: P2)

**Acceptance**: `SubjectErased` calls `erasePerson` on every connection in the recipients ledger for that subject and
lists each on the receipt; the replay store is purged for that subject; disconnecting destroys the secret; a child that
leaves its organisation stops routing upward at once; offboarding deletes connections and sharing levels.

## Requirements

- **FR-001**: the route of an event is the parties, their organisation ancestors and other ancestors per sharing
  level, all in the event's region, computed from the request context and records only.
- **FR-002**: the analytics service publishes one `AnalyticsDeliveryRouted` per connection on the route whose consent
  category is granted, holding only what ADR 0485 decision 7 allows.
- **FR-003**: business integration events mapped to conversions are routed by the same rule with the snapshot they
  carry.
- **FR-004**: match keys are computed in memory with `matchKeysOf` and the connection's `phoneFormat`, only for
  `canErase` connections with `marketing`, and never stored raw.
- **FR-005**: `@stackra/integrations` ships `AnalyticsToolConnector` (`ConnectorKind.Analytics`), optional
  `erasePerson` on it and on `AdPlatformConnector`, and the `canErase` declaration with its recorded-case check.
- **FR-006**: the integrations service sends each routed event in the owning scope's context, retries per
  connection, and records each subject that received match keys or a user id in the recipients ledger.
- **FR-007**: erasure calls `erasePerson` for every ledger entry of the subject and purges its replay rows.
- **FR-008**: the health page, the replay of a time range, alerts and the daily reconciliation exist per connection.
- **FR-009**: Figentra's own full event-level view lands in its regional warehouse and PostHog; its global tools
  receive no contacts.
- **FR-010**: connection secrets are write-only on every surface.
- **FR-011**: an isolation test proves that no tenant outside the route, and no ancestor at `aggregates` or `none`,
  receives an event.

## Success Criteria

- **SC-001**: the marketplace scenario of User Story 2 routes to exactly the expected connections in a test.
- **SC-002**: a canary contact never appears unhashed in any event, row or log, and match keys never reach a
  connection without `canErase`.
- **SC-003**: an erasure test clears every recipient-ledger connection and the replay store.
- **SC-004**: the reconciliation of a seeded day matches ledger revenue to sent values, with every difference given
  a reason.

## Out of scope (named, not built)

- Vendor connectors themselves (OS integrations follow-ups, one per vendor, each with recorded cases).
- The built-in dashboards and warehouse (ADR 0190, 0163), except showing aggregates to non-detail ancestors.
- Google tag, Firebase or other vendor SDKs on devices (ADR 0483 decision 6).
- Code before `/speckit.plan` and `/speckit.tasks` run on this clarified spec.

## Status history

- 2026-10-30 · — → Draft · Claude (builder) · spec and ADR 0485 written for owner approval (tenant GA4 only)
- 2026-10-30 · Draft → Draft · Claude (builder) · rewritten to the owner's routing answers: tree roll-up, connectors
  in integrations, Figentra dual role, delivery guarantees
- 2026-10-30 · Draft → Clarified · owner · "go with all" (relayed by the leader): recommended answers to Q1 to Q7, conservative
  where none was proposed; ADR 0485 Accepted
