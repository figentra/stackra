# Feature Specification: tenant Google Analytics: a tenant's visitor events also go to the tenant's own GA4 property

**Feature Branch**: `figentra/sta-1628-tenant-ga4-destination`

**Created**: 2026-10-30

**Status**: Draft

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1628

**Linear project**: none

**Clarifications status**: pending (owner questions Q1 to Q8 below)

**Input**: Owner request, 2026-10-30: tenants (businesses on the platform) can see their own analytics in their own
Google Analytics. ADR 0483 (STA-1624) routes app analytics through the `relay` driver to the analytics service and
covers only Figentra measuring its own product; its decision 5 and STA-1624 clarification Q2 left a tenant's own
property to a separate decision. Decision record: ADR 0485 (Proposed, this branch). Builds on the unlanded branch
`figentra/sta-1624-analytics-relay`.

## Impact

- **Apps touched**: none in core. Template lines mark the events of tenant-owned surfaces (storefront, site, branded
  app, portal) as tenant visible, and the console gains the connect form (template line and OS follow-ups)
- **Services touched**: none in core. Figentra OS `services/analytics-reports` owns the `analytics.scopeGa4` setting
  and runs the scope fan-out; the OS integrations service hosts the `Ga4Connection` in the connection store (OS
  follow-ups)
- **Packages touched**: `packages/cross-cutting/analytics` (`./contracts`: the tenant-visible event marker and the
  scope destination type; `./node`: the scope branch of `IngestAnalyticsBatchAction` and `FanOutAnalyticsListener`,
  the setting class); `@stackra-pro/analytics-destinations` in `figentra/stackra-pro` (`Ga4Integration`,
  `Ga4Connection`, the `ga4` driver taking per-call credentials)
- **Cross-service events**: none new. The existing `analytics.batch.accepted.v1` gains the destination `scope-ga4` and
  the `ScopeRef` it was accepted for; it is written and consumed inside the analytics service. The setting cache is
  dropped on the existing `settings.changed.v1`
- **Tenancy and data**: tenant-owned data. One setting row per tenant (`analytics.scopeGa4`, `TenancyScopes.Tenant`
  level, owned by analytics-reports) and one connection per tenant in the connection store (integrations service, RLS
  and the tenant data key). The scope for routing comes only from the request's tenant context, never from the
  envelope. No identifier containing `tenant` is declared outside `@stackra/tenancy` (ADR 0323, R-59). The
  isolation test (`security-tenancy-isolation-test`) is required: tenant B's batch never reaches tenant A's property,
  and tenant B cannot read or replace tenant A's connection
- **Secrets**: names only. `GA4_API_SECRET` is a tenant secret, a `@Secret` field of `Ga4Connection` in the connection
  store, written blind and never read back (ADR 0485 decision 3); it is not in Infisical. The deployment's own
  `ANALYTICS_GA4_API_SECRET` (ADR 0483) is unchanged and never used for a tenant send
- **ADR needed**: yes, ADR 0485 (this branch, Proposed); it extends ADR 0483 decision 5
- **New dependencies**: none (`fetch`; `@stackra/integrations`, `@stackra/settings`, `@stackra/contracts` are
  existing packages; whether `@stackra/analytics` may take `@stackra/settings` as a new workspace dependency is a
  plan-time check, no catalog change)
- **Deploy modes**: SaaS in every region (ADR 0485 decision 8), lockable off per region or plan by deployment
  setting lock. On-prem and air-gapped: off by default; an air-gapped install cannot reach Google and keeps the lock on
- **Licence tier**: free for the scope destination mechanism in `@stackra/analytics/node`; Pro for the `ga4` driver,
  `Ga4Integration` and `Ga4Connection` (`@stackra-pro/analytics-destinations`, ADR 0461). Figentra plan entitlement:
  owner question Q3
- **Privacy**: tenant is controller, Figentra processor; Google is the controller's own vendor, not our sub-processor
  for this flow (owner question Q1). DPA clause, record of processing and tenant-surface consent text change before
  release. No `user_id`, IP, user agent or advertising id leaves (ADR 0071 decision 6, ADR 0483 decisions 3 and 6)
- **Docs to update**: ADR 0485; the analytics package README (Destinations, Erasure, Not here yet); the DPA template
  and privacy pages (ADR 0071 decision 5); the ADR index row and nav (integration batch)
- **Lane**: full
- **Change risk**: R3 (tenancy, tenant secrets, PII boundary, outbound HTTP to a tenant-chosen vendor, consent)

## Clarifications

### Session 2026-10-30

Settled by the ADRs, recorded for review (ADR 0485 takes these as its proposal):

- Credentials: a tenant `Connection` with `measurementId` (plain) and `apiSecret` (`@Secret`) in the connection store
  (ADR 0107, 0308 rules 2, 3, 12); a setting holds only a `@ConnectionRef` (ADR 0108 S4). The brief's "measurement id
  is a setting" becomes a plain field of the connection, so the id and its secret stay one credential set.
- Routing scope: the tenant the host resolves for the request; envelope ids are never trusted (tenancy rules).
- Consent: the visitor's verified snapshot (ADR 0472), gated by the setting's category, default `analytics`.
- Region: every region, sent from the tenant's region (ADR 0353 decision 5).
- Code tier: mechanism free, `ga4` and its connection Pro (ADR 0461 decisions 1 and 2).
- Erasure: no `user_id` is sent, the Measurement Protocol cannot delete, so deletion inside the tenant's property is
  the controller's; our hop keeps nothing beyond the outbox row.

### Owner answers, 2026-10-30 (second session: routing across the tenant tree)

The owner widened the scope: every connector (PostHog, GA4, Firebase, Meta, TikTok and others) lives in the
integrations service and is offered to tenants at every level of the tree; Figentra and each level above must see
transactions from everywhere. Answers:

- **Roll-up.** Full event-level detail goes to the parties (the tenant whose surface it happened on, and the seller)
  and to every organisation ancestor (ADR 0243). Other ancestors (host, reseller) get full detail only if the child
  agreed at join, otherwise aggregates. Disclosed in each child's settings.
- **Figentra's view.** Full event level across all tenants. Figentra has a dual role like Shopify: processor of tenant
  data in general, and controller for named purposes of its own (platform analytics, fraud, billing, product
  improvement), stated in the platform terms. That data stays in each region (Figentra's warehouse and a self-hosted
  PostHog per region); Figentra's global tools (PostHog EU, GA4) get events without hashed contacts.
- **Payload to tenant connectors.** Behaviour, conversions, and hashed contact data, but contacts go only to
  connectors where we can carry out an erasure (a deletion API reachable with the tenant's grant); the others get
  behaviour and conversions without contacts. Contacts need the per-person stored consent proof (ADR 0472 decision 5).
- **Routing.** The analytics service checks consent and decides which connections get which events, then publishes
  one event per connection; the integrations service owns the connector, its credentials and the vendor call. Tenant
  secrets never leave integrations. This replaces ADR 0485 decisions 2 and 6 as drafted.
- **Delivery guarantees.** All four: a health page per connection (sent, dropped by consent with reason, failed, last
  error); a replay window (delivered events kept encrypted in region for a set number of days); alerts on repeated
  failure or rejected credentials; a daily reconciliation report (ledger orders and revenue against what each tool
  was sent).

Still open: the replay window length; the source of the Firebase app stream (its app reports need the Firebase SDK on
the device, which ADR 0483 removed); legal review of the KSA and UAE transfer rules. ADR 0485 must be rewritten to
these answers before Q1 to Q8 below are reconsidered; several (Q1, Q4, Q5, Q6) are superseded by them.

### Open questions for the owner

- **Q1 — Google's role on our documents.** Proposed: Google is the controller's own vendor for this flow, named in a
  DPA clause and the record of processing, and not added to our sub-processor list. Or list it anyway as a
  sub-processor "on the controller's instruction"? (legal review)
- **Q2 — Consent category.** Proposed default `analytics`, tenant may choose the stricter `marketing`. Or always
  `marketing`, because the data leaves for Google, where the tenant could link it to ads?
- **Q3 — Plan.** Which Figentra plans get it (ADR 0242: Starter, Pro, Business, Enterprise)? Proposed: every plan, as
  it costs us one outbox event per batch. Separately confirmed: Stackra customers need Pro for the `ga4` driver.
- **Q4 — Which events.** Proposed: only events of tenant-owned surfaces, marked tenant visible by the product, and
  never `identify`, `group` or the tenant staff's use of Figentra's console. Does the owner want a fixed list per
  product (for example `page.viewed`, `screen.viewed`, commerce funnel events), or a tenant-editable include list?
- **Q5 — `user_id`.** Proposed: never, as for our own GA4. Some tenants will ask for signed-in user reports; allow a
  per-tenant hashed id later (then erasure needs the GA4 User Deletion API with the tenant's OAuth grant)?
- **Q6 — Scope level.** Proposed: one property per tenant. Should a scope below the tenant (a branch, a store) be able
  to connect its own property (connection levels `[Scope, Tenant]`, scope depth is a plan limit)?
- **Q7 — Regions that restrict transfers.** Proposed: available in every region, a deployment may lock it off. Should
  it start locked off in the GCC region for KSA PDPL transfer rules until legal review, or for government tenants?
- **Q8 — Consent policy per tenant surface.** Enabling the destination must name Google Analytics on the tenant
  surface's banner and bump that surface's consent policy version (ADR 0298 decision 3). Do tenant surfaces carry a
  consent policy version of their own today, or is that new work in `@stackra/consent` this spec must add?

## User Scenarios & Testing

### User Story 1 - A tenant admin connects its GA4 property (Priority: P1)

A tenant admin opens Analytics → Google Analytics in the console, pastes the measurement id and an API secret created
in GA4, picks the consent category and saves.

**Acceptance**: the connection is created at the tenant level; the API secret is never returned by any read, list,
export, log or error, and the console shows only that it is set and when; `check()` validates the id against the
debug endpoint and the console says a wrong secret cannot be detected; the action is audited with actor and time; an
entitlement or region lock refuses with a typed refusal.

### User Story 2 - The tenant's visitors appear in its GA4 (Priority: P1)

A shopper on the tenant's storefront grants `analytics`; `page.viewed` is relayed.

**Acceptance**: the analytics service publishes one `scope-ga4` event for that tenant besides the deployment's
destinations; the listener sends it with the tenant's credentials; GA4 receives `client_id` (the anonymous id), the
event name and declared properties only.

### User Story 3 - Isolation and consent (Priority: P1)

**Acceptance**: an envelope carrying another tenant's `groups.scope` still routes by the host's tenant; tenant B's
batch never reaches tenant A's property; a snapshot without the setting's category sends nothing to the tenant
destination while the deployment's `analytics` destinations still get it; events not marked tenant visible,
`identify` and `group` never reach it; a request with no tenant context publishes no scope event.

### User Story 4 - Disconnect, offboarding and failure (Priority: P2)

**Acceptance**: disconnecting destroys the stored secret and stops sends at once; a missing or disabled connection
skips and logs `analytics.scope_destination.skipped` without retry; a GA4 failure retries for that tenant alone; on
offboarding the setting and connection go with the tenant.

## Requirements

- **FR-001**: `./contracts` declares a tenant-visible marker for analytics events and the `scope-ga4` destination of
  `analytics.batch.accepted.v1`, which carries the `ScopeRef` from the call context.
- **FR-002**: `IngestAnalyticsBatchAction` publishes one scope event per batch when the request has a scope, its
  `analytics.scopeGa4` setting is enabled and entitled, and the verified snapshot grants the setting's category;
  the event holds only tenant-visible `track` deliveries; no envelope field selects the scope.
- **FR-003**: `FanOutAnalyticsListener` sends a scope event in that scope's context with the connection the setting
  references; a missing, disabled or disconnected connection is skipped, logged and not retried.
- **FR-004**: the Pro `ga4` driver takes the measurement id and API secret per send, sends `client_id` = `anonymousId`,
  and never sends `user_id`, IP, user agent or advertising id.
- **FR-005**: `Ga4Connection.apiSecret` is write-only through every surface (console, API, export, logs, audit,
  errors); `check()` posts to the Measurement Protocol debug endpoint.
- **FR-006**: the setting is lockable off per region and per plan by the deployment.
- **FR-007**: an isolation test proves no cross-tenant send or connection access.

## Success Criteria

- **SC-001**: a two-tenant test shows each batch reaching only its own tenant's property.
- **SC-002**: a canary secret never appears in any read model, log line, error or export in tests.
- **SC-003**: with the category refused, the tenant destination receives nothing while the deployment destination
  receives the batch.

## Out of scope (named, not built)

- Built-in tenant dashboards and the warehouse (ADR 0190, 0163): unchanged; ADR 0485 decision 11 states the split.
- Google tag or Firebase SDK on tenant pages, GA4 Admin API (OAuth, property creation, user deletion), BigQuery
  export, other tenant destinations (Meta, TikTok server events: the `ConversionBridge` covers conversions).
- All code until the owner approves this spec and answers Q1 to Q8.

## Status history

- 2026-10-30 · — → Draft · Claude (builder) · spec and ADR 0485 written for owner approval
