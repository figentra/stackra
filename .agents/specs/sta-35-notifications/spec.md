# Feature Specification: notifications service (`@figentra/service-notifications`) — multi-channel notification engine

> **Retargeted by ADR 0270, decision 12 (D5, owner 2026-10-21).** The `@stackra/notifications` package is dropped.
> Notifications is the OS service `@figentra/service-notifications` in `figentra/figentra-os` (ADRs 0075, 0200), which owns delivery,
> preferences, the log and the in-app inbox and keeps the full engine of every channel (ADR 0086 as amended). Direct
> email from other members goes through the `Mailer` driver in `@stackra/mail`. The template editor is the
> `email-template` document kind on `@stackra/builder`. Where the text below says `@stackra/notifications`,
> `packages/communication/notifications` or "the package", read the service; the plan re-checks each requirement
> against the service shape (ADR 0010, 0260) before implementation. This spec stays here as a design note and moves with
> the service.

**Feature Branch**: `figentra/sta-35-notifications-spec` (supersedes PR #14, branch `spec/notifications`)

**Created**: 2026-10-19

**Status**: Clarified; retargeted to the service by ADR 0270 (re-check in plan)

**Linear**: STA-35 <!-- https://linear.app/figentra/issue/STA-35 -->

**Linear project**: Notifications

**Clarifications status**: complete

**Input**: User description: "A full enterprise-grade, production-ready notifications framework package, @stackra/notifications, MIT. The whole engine; channels email (Resend + SMTP), SMS, WhatsApp, push (Expo push, FCM and APNs direct), in-app (database-backed inbox with read/unread/archive, delivered live via realtime); templates (file-based, i18n, per-tenant overrides, layouts/partials, preview); digests; timezone-aware quiet hours and do-not-disturb; user and tenant preferences with mandatory categories; delivery tracking via provider webhooks; retries, dead-letter, idempotency, rate limits, suppression lists, RFC 8058 one-click unsubscribe; audit and PII redaction. Pro (out of scope, seams only): visual template editor, delivery analytics dashboard, multi-provider failover. Sits on the locked messaging layer (events, outbox, queue, scheduler, realtime, webhooks) and never re-implements it."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: apps/docs only (the package design ADR required by ADR 0018 and a package guide page). apps/console and apps/mobile: none; wiring the headless hooks into them is a separate follow-up spec.
- **Services touched**: none in this repo. Per ADR 0270 decision 12 the engine is the OS service `@figentra/service-notifications` in `figentra/figentra-os` (ADRs 0075 and 0200 stand). This spec stays here as a design note and moves with the service.
- **Packages touched**: no `@stackra/notifications` package (ADR 0270 decision 12); `@stackra/mail` provides the `Mailer` driver. The entry layout below was written for the dropped package (`packages/communication/notifications`) and maps to the service's modules and its `./contracts`. Domain archetype (ADR 0004) with entries `.` (core), `./contracts` (types-only: public interface, event payloads, remote wire contract; no runtime code), `./node` (the notifications module: actions, settings, widgets, resources, workflows if any, events, crons, permissions), `./react` and `./native` (headless hooks and client tools), `./testing` (fakes and the Conformance Suite). No separate `-contracts` package (owner decision C1/N6). Consumed without modification: `@stackra/contracts` (shared primitives: PublicId, Actor, EventEnvelope, Page, errors, diagnostics), `@stackra/events`, `@stackra/outbox`, `@stackra/queue`, `@stackra/scheduler`, `@stackra/realtime`, `@stackra/webhooks`, `@stackra/settings`, `@stackra/connections`, `@stackra/iam`, `@stackra/consent`, `@stackra/i18n`, `@stackra/tenancy`, `@stackra/container`, `@stackra/config`, `@stackra/logger`. `@stackra/workflow` only if an action meets the workflow criteria (W1); none of the v1 actions is expected to.
- **Cross-service events**: published by whichever host service runs the engine, through the outbox, in the `@stackra/contracts` EventEnvelope (which carries the actor chain), topic prefix = host service name: `<svc>.delivery.status-changed.v1` (every delivery state transition), `<svc>.suppression.changed.v1` (address suppressed or released), `<svc>.preference.changed.v1` (a recipient or tenant preference changed), `<svc>.audit.recorded.v1` (audit records for the audit service). Payload types live in `@stackra/notifications/contracts`. Subscribers: the audit service, the Figentra OS analytics (Pro), and `@stackra/webhooks`, which delivers tenant-facing outbound webhooks under the same event type names (N8, one vocabulary). Consumed: the consent-withdrawn event published by `@stackra/consent`, and host domain events bound to notification types with `@OnEvent`. Inbound provider webhooks enter as `@stackra/events` sources, not as cross-service events.
- **Tenancy and data**: new tenant-owned tables, all `tenant_id uuid NOT NULL` + forced RLS (pool), UUIDv7 keys, prefixed public ids: notification, delivery (one per channel attempt target) with its status history, inbox item, recipient preference, suppression entry, digest buffer entry, push device token, template override, raw provider webhook payload. Per-tenant notification settings (category/channel defaults, default timezone, interruptive channels, tracking opt-in, retention overrides, driver instance assignment, tenant rate-limit overrides) are `@Settings` values in the standard `settings_values` table from `@stackra/settings`, resolved through the scope chain default → platform → tenant → user with locks; no notifications-specific settings table. Tenant provider credentials live in `@stackra/connections`, referenced from settings by `@ConnectionRef`. No scope-tree tables (ltree scope nodes are Pro). Default retention (configurable): deliveries and state history 90 days; inbox items 180 days, archived items 30 days after archiving; raw provider webhook payloads 7 days; digest buffers until flush; audit records 1 year; suppression entries until removed (one-way hash after erasure); rendered email/SMS/push bodies not kept after send. Migrations ship with the package for the host to apply; the host owns the database (ADR 0014). Deploy modes: SaaS, on-prem and air-gapped all supported. SaaS and on-prem can use every driver. Air-gapped runs SMTP to an internal relay, the generic HTTP SMS gateway and in-app only; cloud drivers (Resend, Twilio, WhatsApp Cloud API, Expo, FCM, APNs) are refused at startup; the Conformance Suite runs in an air-gapped CI job.
- **Secrets**: references only, never values. Platform-owned provider credentials (K1-A) are secret names the host maps to Encore secret in SaaS or an Infisical-fed store on-prem (ADR 0009): `NOTIFICATIONS_RESEND_API_KEY`, `NOTIFICATIONS_RESEND_WEBHOOK_SECRET`, `NOTIFICATIONS_SMTP_PASSWORD`, `NOTIFICATIONS_TWILIO_AUTH_TOKEN`, `NOTIFICATIONS_SMS_GATEWAY_TOKEN`, `NOTIFICATIONS_WHATSAPP_ACCESS_TOKEN`, `NOTIFICATIONS_WHATSAPP_APP_SECRET`, `NOTIFICATIONS_EXPO_ACCESS_TOKEN`, `NOTIFICATIONS_FCM_SERVICE_ACCOUNT`, `NOTIFICATIONS_APNS_AUTH_KEY`, `NOTIFICATIONS_UNSUBSCRIBE_SIGNING_KEY`, `NOTIFICATIONS_REMOTE_SERVICE_TOKEN` (remote driver). Tenant-owned provider credentials (K1-B, for example a tenant's own Twilio or Resend account) are stored in `@stackra/connections` and referenced by `@ConnectionRef`; settings never hold a raw secret. Infisical Agent Vault is not used: it applies only to AI egress, and notification provider calls go direct.
- **ADR needed**: yes: (1) the `@stackra/notifications` package design ADR (ADR 0018 rule 1); (2) an amendment to ADR 0015 for C1: protocol types move from `@stackra/<domain>-contracts` packages to a types-only `./contracts` entry of the owning package, with shared primitives in `@stackra/contracts`; (3) the runtime and codegen ADRs (Encore as a generated target via `stackra gen`, decorators-only, actions as the unit, risk L0–L4, actor model) being written in PR #16, which this plan relies on; (4) the `@stackra/settings` and `@stackra/connections` ADRs, including the ADR 0009 amendment for the connections store (S4); (5) acceptance of the locked messaging-layer split (events/outbox/queue/scheduler/workflow/realtime/webhooks/notifications) if it is not already an ADR when the plan starts.
- **New dependencies**: `nodemailer` (SMTP driver), `liquidjs` (sandboxed template rendering, safe for tenant-authored overrides), `libphonenumber-js` (E.164 validation for SMS/WhatsApp). Resend, Twilio, the Meta WhatsApp Cloud API, the generic HTTP SMS gateway, Expo push, FCM HTTP v1 and APNs (HTTP/2 + ES256 token auth) are called over platform `fetch`/`node:http2`/`node:crypto` with no vendor SDK. All through `pnpm-workspace.yaml` catalogs, reviewed by dependency-steward.
- **Deploy modes**: SaaS, on-prem and air-gapped are all supported. SaaS and on-prem can use every driver. Air-gapped runs SMTP to an internal relay, the generic HTTP SMS gateway and in-app only; cloud drivers (Resend, Twilio, WhatsApp Cloud API, Expo, FCM, APNs) are refused at startup, and the Conformance Suite runs in an air-gapped CI job (as recorded under Tenancy and data).
- **Licence tier**: free (MIT, this repo). The Pro parts named in the input (visual template editor, delivery analytics dashboard, multi-provider failover) are out of scope; only their seams ship here, and they live in `figentra/stackra-pro`.
- **Docs to update**: `apps/docs`: the `@stackra/notifications` package design ADR and the package guide page (the pages Apps touched names).
- **Lane**: full (ADR 0120 lane table: a new package, tenant data, several pull requests; one PR per user story per D13).
- **Change risk**: R3 (ADR 0120: tenancy and RLS, PII, secrets, inbound webhooks and outbound HTTP). Derived from the answers above; the owner may raise it, never lower it.

## Clarifications

### Session 2026-10-19

Owner answers given in chat on 2026-10-19 (record: the owner decisions memory, rounds 8–11).

- Q: Which Linear project and issue own this spec? → A: A new STA project "Notifications" plus one spec issue, labelled `agent`. Delivery: one spec, one Linear project, one PR per user story, US1 and US2 first (D13).
- Q: Which SMS and WhatsApp providers ship as free drivers in v1? → A: Twilio SMS, the Meta WhatsApp Cloud API directly, and a generic HTTP SMS gateway driver for on-prem and air-gapped.
- Q: What are the default retention periods? → A: Deliveries 90 days; inbox 180 days (archived 30 days); raw webhooks 7 days; audit 1 year; suppressions until removed (hashed after erasure); rendered bodies not kept.
- Q: Which push providers ship? → A: Expo push by default, plus direct FCM HTTP v1 and APNs; web push later.
- Q: Which template engine? → A: `liquidjs`, sandboxed.
- Q: Where do the public types live? → A: In `@stackra/notifications/contracts`, a types-only entry, with shared primitives from `@stackra/contracts` (C1). No separate `-contracts` package.
- Q: Which package archetype? → A: Domain archetype with `react` and `native` hook entries.
- Q: Which event names do tenant-facing outbound webhooks use? → A: The same status-changed event type names as the contracts.
- Q: What is the open/click tracking default? → A: Off; opt-in per tenant and category.
- Q: Who is recorded as acting? → A: The actor model from `@stackra/contracts` (type, id, tenant, via, credential, onBehalfOf chain) on every action, audit record and event envelope.
- Q: How are operations exposed and risk-rated? → A: Every operation is an action with a risk level L0–L4 (L2 tenant-configurable approval for agents, L3–L4 always need a named human). A workflow sits behind an action only when the workflow criteria hit. Digest flushes and quiet-hours releases run as scheduler cron or delayed queue jobs that dispatch actions.
- Q: Where do per-tenant notification settings and tenant credentials live? → A: Settings in `@stackra/settings` (`@Settings`, scope chain); tenant provider credentials in `@stackra/connections` via `@ConnectionRef`; platform credentials in Infisical/Encore secret.
- Q: What does the module contribute? → A: The notifications module is the unit of contribution: it exposes its own settings, widgets, resources and client tools.
- Q: Does Infisical Agent Vault apply? → A: No, it applies only to AI egress.

## Glossary

Terms used as subjects in the EARS criteria below. Each is defined once here.

| Term                                 | Definition                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notification Engine** (the Engine) | The core of `@stackra/notifications`: accepts send requests, resolves recipients, preferences, templates and channels, and dispatches deliveries as queue jobs.                                                                                                     |
| **Host**                             | The application or service that installs the package, registers it with `@stackra/container`, declares notification types, owns the database and runs the generated endpoints, jobs and crons.                                                                      |
| **Notification Type**                | A code-declared kind of notification (for example `invoice.paid`) with a category, its allowed channels, a priority, digest and quiet-hours behaviour, and its templates.                                                                                           |
| **Category**                         | The preference grouping a notification type belongs to (for example `billing`, `marketing`, `security`). A category is either **mandatory** or **optional**.                                                                                                        |
| **Mandatory Category**               | A category whose notifications are transactional or legally required (security alerts, receipts, OTP). Recipients cannot opt out of it, and it never carries an unsubscribe link.                                                                                   |
| **Notification**                     | One logical send request for one recipient and one notification type, identified by its idempotency key. It fans out into one Delivery per selected channel.                                                                                                        |
| **Recipient**                        | The person addressed: a user id within a tenant plus the contact points the Host resolves (email address, phone number, WhatsApp number, push device tokens, in-app identity), locale and IANA timezone.                                                            |
| **Channel**                          | One medium: `email`, `sms`, `whatsapp`, `push`, `in_app`.                                                                                                                                                                                                           |
| **Channel Driver**                   | An implementation of one channel against one provider (Resend, SMTP, Twilio SMS, the generic HTTP SMS gateway, the Meta WhatsApp Cloud API, Expo push, FCM, APNs, the database inbox).                                                                              |
| **Driver Instance**                  | A named, configured Channel Driver registered through `forRoot({ default, instances: { name: { driver } } })`. A channel may have several instances.                                                                                                                |
| **Delivery**                         | One attempt-tracked unit: one Notification on one channel through one Driver Instance to one contact point.                                                                                                                                                         |
| **Delivery State**                   | One of `queued`, `sent`, `delivered`, `opened`, `clicked`, `failed`, `bounced`, `skipped` (see FR-050).                                                                                                                                                             |
| **Template**                         | File-based message source for one notification type, channel and locale, built from a Layout and Partials, rendered with variables.                                                                                                                                 |
| **Template Override**                | A tenant-specific replacement of a Template for a given type, channel and locale, stored in the database.                                                                                                                                                           |
| **Layout** / **Partial**             | A shared wrapper (Layout) and a reusable fragment (Partial) that Templates compose.                                                                                                                                                                                 |
| **Digest**                           | A single message that batches several notifications of digestible types for one recipient and channel collected over a Digest Window.                                                                                                                               |
| **Digest Window**                    | The interval (for example hourly, or daily at a local time) over which digestible notifications are buffered before one Digest is flushed.                                                                                                                          |
| **Quiet Hours**                      | A recurring daily window in the recipient's timezone during which non-bypass deliveries on interruptive channels are held.                                                                                                                                          |
| **Do Not Disturb (DND)**             | A recipient-set, time-bounded or open-ended hold on non-bypass deliveries.                                                                                                                                                                                          |
| **Preference**                       | A recipient's or tenant's on/off choice per category and channel; tenant preferences are the defaults recipients inherit.                                                                                                                                           |
| **Suppression List**                 | Per-tenant record of contact points that must not be sent to on a channel, with a reason (`hard_bounce`, `complaint`, `unsubscribe`, `stop_keyword`, `invalid`, `manual`).                                                                                          |
| **Provider Webhook**                 | An inbound HTTP callback from a provider reporting delivery status, bounces, complaints, opens, clicks or inbound SMS/WhatsApp messages; it enters as an `@stackra/events` source.                                                                                  |
| **Inbox**                            | The database-backed in-app channel: per-recipient Inbox Items with `unread`, `read` and `archived` status.                                                                                                                                                          |
| **Idempotency Key**                  | A caller-supplied key that makes a send request at-most-once within a tenant.                                                                                                                                                                                       |
| **Dead Letter**                      | A Delivery whose retries are exhausted or whose error is permanent, parked by `@stackra/queue` with its reason for inspection and replay.                                                                                                                           |
| **Rate Limit Policy**                | A maximum send rate per Driver Instance and per tenant.                                                                                                                                                                                                             |
| **Conformance Suite**                | The shared test suite every Channel Driver must pass, run offline against fake providers.                                                                                                                                                                           |
| **Deploy Mode**                      | `saas`, `on_prem` or `air_gapped`.                                                                                                                                                                                                                                  |
| **Remote Driver**                    | An Engine implementation that forwards the same public interface to a hosted notifications service (Figentra OS) over the wire contract in `@stackra/notifications/contracts`.                                                                                      |
| **Headless Hooks**                   | React and React Native hooks (no UI components) for the Inbox and Preferences.                                                                                                                                                                                      |
| **Action**                           | The unit of every operation (send, mark read, set preference, save override, replay): a declared, authorised, audited operation with a Risk Level and allowed actor types, exposed through endpoints, jobs or tools.                                                |
| **Actor**                            | Who performs an Action, per `@stackra/contracts`: type (`user`, `service`, `agent`, `external-agent`, `job`, `webhook`, `system`, `anonymous`), id, tenant, via (`http`, `mcp`, `a2a`, `cli`, `queue`, `cron`, `event`, `ui`), credential and the onBehalfOf chain. |
| **Risk Level**                       | `L0` (read or UI-only) to `L4` declared on every Action; `L2` needs approval for agent actors unless the tenant configures otherwise, `L3` and `L4` always need a named human.                                                                                      |
| **Tenant Notification Settings**     | The notifications module's `@Settings` values in `@stackra/settings`, resolved through the scope chain default → platform → tenant → user, with locks.                                                                                                              |
| **Connection**                       | A tenant-owned provider credential stored encrypted in `@stackra/connections` and referenced from settings by `@ConnectionRef`.                                                                                                                                     |
| **API areas**                        | `public` (unauthenticated, signed: provider webhooks, unsubscribe), `app` (end user), `admin` (tenant admin), `platform` (operator).                                                                                                                                |

EARS patterns used: ubiquitous (`THE <subject> SHALL ...`), event-driven (`WHEN <trigger>, THE <subject> SHALL ...`), state-driven (`WHILE <state>, THE <subject> SHALL ...`), unwanted behaviour (`IF <condition>, THEN THE <subject> SHALL ...`), optional feature (`WHERE <feature>, THE <subject> SHALL ...`).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Send a transactional email exactly once (Priority: P1)

A Host developer declares a notification type with an email template, registers a Resend or SMTP driver instance, and sends it to a recipient from a domain event handler. The email is rendered in the recipient's locale, queued, sent, and its state is recorded. Retrying the same request does not send twice.

**Why this priority**: This is the engine's spine: types, templates, idempotency, queueing, retries, state tracking. Every other story reuses it.

**Independent Test**: With an in-memory queue and a fake SMTP server (no network), send the same request twice with one idempotency key, and assert one email arrives and the Delivery reaches `sent`.

**Acceptance Scenarios**:

1. **Given** a declared type `invoice.paid` with an English email template and a default email instance, **When** the Host sends it to a recipient with locale `en`, **Then** one Delivery is created in `queued`, a queue job sends it, and it moves to `sent` with the provider message id recorded.
2. **Given** a send already accepted with idempotency key K, **When** the same tenant sends again with key K within 24 hours, **Then** no new Notification is created and the original Notification id is returned.
3. **Given** the provider returns a transient error, **When** the job runs, **Then** it is retried with backoff, and after the last attempt the Delivery is `failed` and dead-lettered with the error reason.
4. **Given** the provider rejects the address permanently, **When** the job runs, **Then** the Delivery is `failed` without retries and the address is suppressed with reason `invalid`.

---

### User Story 2 - In-app inbox with live delivery (Priority: P1)

An end user of a Host's web or mobile app sees a notification appear in their inbox while the app is open, sees the unread count change, and can mark items read, unread or archived. Developers build their own UI on headless hooks.

**Why this priority**: In-app is the only channel that needs no external provider, so it is the channel every deploy mode, including air-gapped, can always offer.

**Independent Test**: Send an `in_app` notification to a connected test client; assert the item and new unread count arrive live, then mark it read through the app API and assert the count drops and other sessions of the same user update.

**Acceptance Scenarios**:

1. **Given** a recipient with an open realtime connection, **When** an in-app notification is delivered, **Then** the inbox item and the updated unread count reach every connected session of that recipient.
2. **Given** a recipient who was offline, **When** they open the app, **Then** the cursor-paginated inbox list returns the items delivered while offline, newest first.
3. **Given** an unread item, **When** the recipient marks it read, archives it, or marks all as read, **Then** the status and unread count change and every connected session is updated.

---

### User Story 3 - Preferences, mandatory categories and consent (Priority: P2)

An end user turns off marketing emails but keeps marketing push; a tenant admin sets defaults for their organisation; security alerts can never be turned off.

**Why this priority**: Sending what a person opted out of is a GDPR and trust failure; it must exist before marketing traffic flows.

**Independent Test**: Set a recipient preference off for `marketing`/`email`; send a marketing type on email and push; assert email is `skipped` with reason `preference` and push is sent. Attempt to disable a mandatory category; assert rejection.

**Acceptance Scenarios**:

1. **Given** tenant default `marketing`/`email` = on and recipient preference = off, **When** a marketing notification is sent, **Then** the email Delivery is `skipped` (reason `preference`).
2. **Given** category `security` is mandatory, **When** a recipient tries to disable it, **Then** the request is rejected and the preference is unchanged.
3. **Given** a category that requires consent and a recipient whose consent was withdrawn in `@stackra/consent`, **When** a notification in that category is sent, **Then** every Delivery is `skipped` (reason `consent`).

---

### User Story 4 - SMS and WhatsApp with STOP handling (Priority: P2)

A Host sends SMS and WhatsApp messages; a recipient replies STOP and receives nothing further on that channel until they reply START.

**Why this priority**: Required for OTP and alerting use cases; STOP handling is a carrier and legal requirement.

**Independent Test**: Against a fake provider, send an SMS, post a signed inbound STOP webhook, send again, and assert the second Delivery is `skipped` (reason `suppressed`).

**Acceptance Scenarios**:

1. **Given** a recipient phone number in E.164 form, **When** an SMS notification is sent, **Then** it is sent through the SMS instance and its state tracked.
2. **Given** an inbound STOP message webhook for that number, **When** it is processed, **Then** the number is suppressed on that channel with reason `stop_keyword`.
3. **Given** a suppressed number, **When** an inbound START message arrives, **Then** the suppression is released.
4. **Given** a WhatsApp send outside the provider's customer-service window, **When** the type has no approved provider template, **Then** the Delivery fails with reason `template_required` without calling the provider.

---

### User Story 5 - Push to mobile devices (Priority: P2)

A mobile app registers its device push token; the Host sends push notifications through Expo push, or directly through FCM and APNs; dead tokens are cleaned up.

**Why this priority**: Mobile engagement depends on it; the owner chose Expo push for day one.

**Independent Test**: Register two tokens for a recipient, send a push through a fake provider that reports one token unregistered, and assert one Delivery `sent`, one `failed`, and the dead token removed.

**Acceptance Scenarios**:

1. **Given** a recipient with registered device tokens, **When** a push notification is sent, **Then** one Delivery per token is dispatched through the configured push instance.
2. **Given** the provider reports a token as unregistered or invalid, **When** the response or receipt is processed, **Then** the token is deleted and the Delivery is `failed` with reason `device_unregistered`.

---

### User Story 6 - Delivery tracking and bounces from provider webhooks (Priority: P2)

Delivery states advance from provider callbacks; hard bounces and complaints suppress the address; tenants can receive delivery status via outbound webhooks.

**Why this priority**: Without it, retries and suppression lists cannot be correct and sender reputation degrades.

**Independent Test**: Post signed webhooks (delivered, then a late duplicate, then a hard bounce for a second message) and assert states, deduplication and suppression.

**Acceptance Scenarios**:

1. **Given** a `sent` Delivery, **When** a signed `delivered` webhook arrives, **Then** the Delivery becomes `delivered` and a status-changed event is published.
2. **Given** the same webhook delivered twice, **When** both are processed, **Then** the second has no effect.
3. **Given** a webhook with an invalid signature, **When** it arrives, **Then** it is rejected and nothing changes.
4. **Given** a hard bounce or spam complaint, **When** it is processed, **Then** the Delivery is `bounced` and the address is suppressed.

---

### User Story 7 - Digests (Priority: P3)

A recipient who would get forty comment notifications in an hour gets one digest email listing them instead.

**Why this priority**: Prevents notification fatigue; not needed for the first transactional sends.

**Independent Test**: With a controllable clock, send five digestible notifications inside an hourly window and advance the clock past the flush; assert exactly one digest Delivery listing five items.

**Acceptance Scenarios**:

1. **Given** a digestible type with an hourly window on email, **When** five notifications arrive within the window, **Then** they are buffered and one digest is sent at the flush.
2. **Given** a daily window at 08:00 local time, **When** the flush runs, **Then** each recipient's digest goes out at 08:00 in that recipient's timezone.

---

### User Story 8 - Quiet hours and do-not-disturb (Priority: P3)

A recipient in Dubai with quiet hours 22:00–07:00 gets non-urgent push and SMS the next morning, while a password-reset code still arrives immediately.

**Why this priority**: Respectful delivery; depends on Stories 1, 4 and 5.

**Independent Test**: With a controllable clock in the recipient's timezone, send a non-bypass push at 23:00 and a bypass OTP SMS at 23:00; assert the OTP is sent and the push is released at 07:00.

**Acceptance Scenarios**:

1. **Given** quiet hours 22:00–07:00 in `Asia/Dubai`, **When** a non-bypass push is sent at 23:00 local, **Then** it is held and released at 07:00 local.
2. **Given** a type marked bypass-quiet-hours, **When** it is sent during quiet hours or DND, **Then** it is delivered immediately.
3. **Given** a daylight-saving transition inside the window, **When** the window is evaluated, **Then** release happens at the recipient's local wall-clock end time.

---

### User Story 9 - Per-tenant templates, i18n and preview (Priority: P3)

A tenant admin overrides the welcome email for their organisation in English and Arabic and previews it before saving; recipients get the tenant's version in their locale.

**Why this priority**: White-label products need it; the Pro visual editor builds on the same override store.

**Independent Test**: Save an Arabic override for tenant A, preview it with sample data, send to recipients in tenants A and B; assert A gets the override, B gets the default.

**Acceptance Scenarios**:

1. **Given** a tenant override for type T, channel email, locale `ar`, **When** an Arabic-locale recipient in that tenant is notified, **Then** the override is rendered inside the configured Layout.
2. **Given** no override and no template for the recipient's locale, **When** rendering, **Then** the default locale's template is used.
3. **Given** a tenant admin previewing an override with sample variables, **When** preview is requested, **Then** the rendered output is returned and nothing is sent or stored as a Delivery.

---

### User Story 10 - One-click unsubscribe (Priority: P3)

A recipient clicks "Unsubscribe" in their mail client and is unsubscribed from that category's email without logging in.

**Why this priority**: Required by mailbox providers for bulk senders and by GDPR; only matters once optional-category email is sent.

**Independent Test**: Render an optional-category email; assert the RFC 8058 headers are present; POST the one-click body to the URL; assert the preference is off and the next send in that category is `skipped`.

**Acceptance Scenarios**:

1. **Given** an email in an optional category, **When** it is rendered, **Then** it carries `List-Unsubscribe` (HTTPS URL with a signed token) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
2. **Given** a valid one-click POST, **When** it is received, **Then** the recipient's preference for that category and channel is turned off without authentication or a confirmation step.
3. **Given** a mandatory-category email, **When** it is rendered, **Then** it carries no unsubscribe headers or link.

---

### User Story 11 - Operations: dead letters, rate limits and audit (Priority: P3)

A platform operator inspects dead-lettered deliveries and replays them after a provider outage; rate limits keep a noisy tenant from exhausting a shared provider; every configuration change is audited.

**Why this priority**: SOC 2 and production operability; needed before general availability, not for first sends.

**Independent Test**: Force a provider outage, exhaust retries, list dead letters through the platform API, replay one, and assert it sends once and an audit record exists for the replay.

**Acceptance Scenarios**:

1. **Given** dead-lettered deliveries, **When** an operator lists and replays one, **Then** it is re-queued once and the replay is audited.
2. **Given** a tenant exceeding its rate limit on an instance, **When** more deliveries arrive, **Then** they are deferred, not failed, and other tenants' deliveries proceed.

---

### User Story 12 - Every deploy mode, and a remote service seam (Priority: P3)

The same Host code runs SaaS, on-prem and air-gapped; switching to a hosted Figentra OS notifications service is a configuration change.

**Why this priority**: Figentra OS sells all three modes; the seam must exist from day one even though the hosted service is built elsewhere.

**Independent Test**: Run the conformance suite for every driver in a job with outbound network disabled; run the Engine's public-interface tests against both the local Engine and the Remote Driver pointed at a fake server.

**Acceptance Scenarios**:

1. **Given** deploy mode `air_gapped` with SMTP, an on-prem SMS gateway and in-app configured, **When** the Host starts, **Then** it starts and sends with no outbound internet access.
2. **Given** an instance that needs the public internet (for example APNs) in `air_gapped` mode, **When** the Host starts, **Then** startup fails with an error naming the instance and the mode.
3. **Given** a Remote Driver configured as the default, **When** the Host sends, reads the inbox or sets preferences, **Then** the calls behave as with the local Engine.

---

### Edge Cases

- A recipient has no contact point for a selected channel: that Delivery is `skipped` (reason `no_contact`); other channels proceed.
- A notification type is sent with variables that do not satisfy its declared variable schema: the send is rejected before anything is queued.
- A template references a missing variable or partial at render time: the Delivery fails with reason `render_error`; no partial message is sent.
- Provider webhooks arrive out of order (`opened` before `delivered`): state never moves backwards; `delivered` is recorded in history without regressing the current state.
- A webhook refers to an unknown provider message id: it is acknowledged, logged without PII and dropped.
- A tenant is deleted or offboarded: its queued and held deliveries are cancelled and its data follows the retention and erasure rules.
- A GDPR erasure request for a recipient: their inbox items, preferences, device tokens, digest buffer and delivery contact points are erased or anonymised; suppression entries keep only a one-way hash so the suppression still holds.
- A digest window flush finds a single buffered item: it is sent as a digest of one (no special case).
- A recipient's timezone is unknown: the tenant default timezone applies; if none, UTC.
- Quiet hours end while a held delivery's type has an expiry (for example a 10-minute alert): expired held deliveries become `skipped` (reason `expired`).
- A rate limit and quiet hours both defer the same delivery: it is released at the later of the two.
- A driver instance is removed from configuration while deliveries for it are queued: those deliveries fail with reason `instance_unavailable` and are dead-lettered for replay.
- The realtime connection drops: inbox correctness does not depend on it; the client re-syncs by cursor on reconnect.
- The same push token is registered by two users (device changes hands): it belongs to the latest registration only.

## Requirements _(mandatory)_

### Functional Requirements

#### Engine, types and sending

- **FR-001**: THE Notification Engine SHALL accept a send request containing tenant, notification type, recipient, variables, an optional channel subset and an idempotency key.
- **FR-002**: THE Notification Engine SHALL require every Notification Type to be declared in code with its category, allowed channels, variable schema, priority, digest behaviour and quiet-hours behaviour.
- **FR-003**: WHEN the Host starts, THE Notification Engine SHALL verify that every declared type has a template for the default locale on each of its allowed channels and SHALL fail startup naming each missing template.
- **FR-004**: IF a send request's variables do not satisfy the type's variable schema, THEN THE Notification Engine SHALL reject the request before creating a Notification.
- **FR-005**: WHEN a send request is accepted, THE Notification Engine SHALL create one Notification and one Delivery per channel selected by the intersection of the type's allowed channels, the requested subset, the Recipient's Preferences and the Recipient's available contact points.
- **FR-006**: WHEN a send request is accepted inside a database transaction of the Host, THE Notification Engine SHALL record it through the transactional outbox so that the Notification exists if and only if that transaction commits.
- **FR-007**: THE Notification Engine SHALL dispatch every Delivery as an `@stackra/queue` job and SHALL NOT call a provider inside the caller's request.
- **FR-008**: WHEN a send request repeats an idempotency key already accepted for the same tenant within 24 hours, THE Notification Engine SHALL return the original Notification id and SHALL NOT create another Notification.
- **FR-009**: THE Notification Engine SHALL allow a Host to bind a Notification Type to a domain event with `@OnEvent`, deriving the idempotency key from the event id.
- **FR-010**: THE Notification Engine SHALL expose one public interface of Actions (send, inbox, preferences, device tokens, suppression, preview) that both the local Engine and the Remote Driver implement.

#### Channels and drivers

- **FR-011**: THE Notification Engine SHALL register Channel Drivers through the house instance-module pattern `forRoot({ default, instances: { name: { driver } } })` with explicit `@stackra/container` tokens and no `reflect-metadata`.
- **FR-012**: THE Notification Engine SHALL ship these Channel Drivers: email via Resend, email via SMTP, SMS via Twilio, SMS via a generic HTTP SMS gateway (configurable endpoint for on-prem and air-gapped gateways), WhatsApp via the Meta WhatsApp Cloud API, push via Expo push (the default push instance), push via FCM HTTP v1, push via APNs token authentication, and in-app via the database Inbox.
- **FR-013**: THE Notification Engine SHALL ship a Conformance Suite, and every Channel Driver SHALL pass it against a fake provider with no outbound network access.
- **FR-014**: THE Notification Engine SHALL read platform provider credentials only as secret references and tenant provider credentials only as `@ConnectionRef` Connections, both resolved at call time, and SHALL NOT accept a credential value in configuration or settings.
- **FR-015**: IF a configured Driver Instance requires public internet access and the Deploy Mode is `air_gapped`, THEN THE Notification Engine SHALL fail startup with an error naming the instance and the mode.
- **FR-016**: WHERE a channel has more than one Driver Instance, THE Notification Engine SHALL choose the instance through a routing strategy interface whose free implementation selects the type's configured instance or the channel default.
- **FR-017**: THE Notification Engine SHALL receive queue topics, subscriptions, cron jobs and endpoint bindings from the Host's code generator (`stackra gen`) through duck-typed adapters and SHALL NOT import `encore.dev`.
- **FR-018**: WHEN an SMS or WhatsApp recipient number is not a valid E.164 number, THE Notification Engine SHALL mark that Delivery `skipped` with reason `invalid` without calling the provider.
- **FR-019**: IF a WhatsApp Delivery falls outside the provider's customer-service window and the type has no approved provider template, THEN THE Notification Engine SHALL mark it `failed` with reason `template_required` without calling the provider.

#### In-app inbox

- **FR-020**: WHEN an in-app Delivery is processed, THE Notification Engine SHALL store an Inbox Item with status `unread` and SHALL publish it with the Recipient's new unread count through `@stackra/realtime` to that Recipient's sessions only.
- **FR-021**: THE Notification Engine SHALL provide app-area endpoints to list Inbox Items by cursor (limit at most 100, newest first, filterable by status and category), get the unread count, mark read, mark unread, archive, unarchive and mark all read.
- **FR-022**: WHEN an Inbox Item's status changes, THE Notification Engine SHALL publish the change and the new unread count to all of that Recipient's sessions.
- **FR-023**: THE Notification Engine SHALL provide Headless Hooks for React and React Native covering the inbox list, unread count, status changes, live updates and preferences, with no UI components.
- **FR-024**: IF a Recipient requests an Inbox Item that belongs to another Recipient or tenant, THEN THE Notification Engine SHALL respond `notFound`.

#### Templates and i18n

- **FR-025**: THE Notification Engine SHALL load default Templates, Layouts and Partials from files shipped by the Host or a package, per type, channel and locale.
- **FR-026**: THE Notification Engine SHALL resolve a Template in this order: tenant override in the Recipient's locale, tenant override in the tenant default locale, file Template in the Recipient's locale, file Template in the default locale.
- **FR-027**: THE Notification Engine SHALL resolve locale strings, plural forms, dates, numbers and text direction through `@stackra/i18n`.
- **FR-028**: THE Notification Engine SHALL render Templates in a sandbox that cannot execute arbitrary code or read files outside the template set, so tenant-authored overrides are safe.
- **FR-029**: THE Notification Engine SHALL escape variable output by channel (HTML for email bodies, plain text for SMS, provider-specific for WhatsApp and push) unless the template explicitly marks a variable as trusted.
- **FR-030**: WHEN a tenant admin saves a Template Override, THE Notification Engine SHALL validate that it renders with the type's sample variables and SHALL reject it with the render error otherwise.
- **FR-031**: WHEN preview is requested, THE Notification Engine SHALL return the rendered subject, bodies and headers for a type, channel, locale and tenant with given or sample variables without creating a Delivery or calling a provider.
- **FR-032**: THE Notification Engine SHALL expose Template Override storage and preview through an interface that a Pro visual editor can use without changes to the package.

#### Preferences and consent

- **FR-033**: THE Notification Engine SHALL store tenant Preference defaults as Tenant Notification Settings and Recipient Preferences per category and channel, with the Recipient's value overriding the tenant default.
- **FR-034**: IF a request tries to disable a Mandatory Category for a Recipient or tenant, THEN THE Notification Engine SHALL reject it with `failedPrecondition`.
- **FR-035**: WHEN a Delivery's category and channel are disabled for the Recipient, THE Notification Engine SHALL mark it `skipped` with reason `preference`.
- **FR-036**: WHERE a category requires consent, THE Notification Engine SHALL check the Recipient's consent in `@stackra/consent` before dispatch and SHALL mark the Delivery `skipped` with reason `consent` when consent is absent or withdrawn.
- **FR-037**: WHEN a consent-withdrawn event is received from `@stackra/consent`, THE Notification Engine SHALL skip that Recipient's queued and held deliveries in the affected categories.
- **FR-038**: WHEN a Preference changes, THE Notification Engine SHALL record an audit entry and publish a preference-changed event.

#### Digests

- **FR-039**: WHERE a type is digestible, THE Notification Engine SHALL buffer its Deliveries per Recipient, channel and digest key instead of dispatching them.
- **FR-040**: WHEN a Digest Window closes, THE Notification Engine SHALL render all buffered items for that Recipient and channel into one Digest Delivery and SHALL clear the buffer in the same transaction.
- **FR-041**: THE Notification Engine SHALL trigger digest flushes from `@stackra/scheduler` cron jobs that only dispatch queue jobs, evaluating daily windows at the Recipient's local time.
- **FR-042**: WHERE a digest exceeds its configured maximum item count, THE Notification Engine SHALL include the newest items up to the maximum and a count of the remainder.
- **FR-043**: WHERE a type is mandatory or bypasses digests, THE Notification Engine SHALL dispatch it immediately even when the Recipient has an open digest buffer.

#### Quiet hours and do-not-disturb

- **FR-044**: WHILE a Recipient is inside Quiet Hours or DND, THE Notification Engine SHALL hold non-bypass Deliveries on push, SMS and WhatsApp and SHALL release them when the window ends.
- **FR-045**: THE Notification Engine SHALL evaluate Quiet Hours in the Recipient's IANA timezone, falling back to the tenant default timezone and then UTC, and SHALL handle daylight-saving transitions by local wall-clock time.
- **FR-046**: WHERE a type is marked bypass-quiet-hours, THE Notification Engine SHALL dispatch it during Quiet Hours and DND.
- **FR-047**: IF a held Delivery's type expiry passes before release, THEN THE Notification Engine SHALL mark it `skipped` with reason `expired`.
- **FR-048**: THE Notification Engine SHALL NOT hold email or in-app Deliveries for Quiet Hours unless the tenant configures those channels as interruptive.

#### Delivery tracking

- **FR-049**: THE Notification Engine SHALL record every Delivery State transition with timestamp, provider, provider message id and a redacted reason, and SHALL publish a status-changed event through the outbox for each one.
- **FR-050**: THE Notification Engine SHALL use exactly these Delivery States: `queued`, `sent`, `delivered`, `opened`, `clicked`, `failed`, `bounced`, `skipped`, where `failed`, `bounced` and `skipped` are terminal for sending.
- **FR-051**: IF a provider event would move a Delivery to an earlier state in the order `queued` < `sent` < `delivered` < `opened` < `clicked`, THEN THE Notification Engine SHALL record it in history without changing the current state.
- **FR-052**: WHEN a Provider Webhook arrives, THE Notification Engine SHALL verify its provider signature before any processing and SHALL reject an invalid signature without side effects.
- **FR-053**: THE Notification Engine SHALL receive Provider Webhooks as `@stackra/events` sources on public-area endpoints and SHALL deduplicate them through the `@stackra/outbox` inbox keyed by provider event id.
- **FR-054**: WHERE a provider supports open and click tracking, THE Notification Engine SHALL record `opened` and `clicked`, and SHALL leave tracking off unless the tenant enables it per category.
- **FR-055**: THE Notification Engine SHALL offer delivery status events to `@stackra/webhooks` so a tenant can subscribe to them as Standard Webhooks.
- **FR-056**: THE Notification Engine SHALL expose admin-area endpoints to list Deliveries by cursor and to read one Delivery's state history within the caller's tenant.

#### Reliability: retries, dead letters, idempotency, rate limits

- **FR-057**: IF a provider call fails with a transient error, THEN THE Notification Engine SHALL retry through `@stackra/queue` with exponential backoff and jitter up to the configured maximum attempts, honouring a provider `Retry-After`.
- **FR-058**: IF a provider call fails with a permanent error, THEN THE Notification Engine SHALL mark the Delivery `failed` without retrying.
- **FR-059**: WHEN retries are exhausted, THE Notification Engine SHALL mark the Delivery `failed` and SHALL dead-letter it with its last error class and attempt count.
- **FR-060**: THE Notification Engine SHALL pass a stable per-Delivery idempotency key to every provider that supports one, so a retried job does not send twice.
- **FR-061**: THE Notification Engine SHALL provide platform-area endpoints to list, inspect and replay dead-lettered Deliveries, and every replay SHALL be audited.
- **FR-062**: THE Notification Engine SHALL enforce a Rate Limit Policy per Driver Instance and per tenant on that instance.
- **FR-063**: IF a Delivery would exceed a Rate Limit Policy, THEN THE Notification Engine SHALL defer it by re-queuing with a delay and SHALL NOT mark it failed.

#### Suppression and unsubscribe

- **FR-064**: WHEN a hard bounce, a spam complaint, an inbound SMS or WhatsApp message matching a stop keyword (STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT, case-insensitive), an unsubscribe or an invalid-address error is received, THE Notification Engine SHALL add the contact point to the tenant's Suppression List for that channel with the reason.
- **FR-065**: WHEN a Delivery in an optional Category targets a contact point suppressed on that channel for any reason, THE Notification Engine SHALL mark it `skipped` with reason `suppressed`.
- **FR-066**: IF a Delivery in a Mandatory Category targets a contact point suppressed for `hard_bounce` or `invalid`, THEN THE Notification Engine SHALL mark it `skipped` with reason `suppressed`.
- **FR-067**: WHEN an inbound SMS or WhatsApp message matches START or UNSTOP (case-insensitive), THE Notification Engine SHALL release the sender's `stop_keyword` suppression on that channel.
- **FR-068**: WHEN an optional-category email is rendered, THE Notification Engine SHALL add `List-Unsubscribe` with an HTTPS URL carrying a signed token and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, per RFC 8058.
- **FR-069**: WHEN a valid one-click unsubscribe POST is received, THE Notification Engine SHALL turn off that Recipient's preference for the category and channel without authentication, redirect or confirmation, and SHALL audit it.
- **FR-070**: IF an unsubscribe token's signature is invalid, THEN THE Notification Engine SHALL reject it without revealing whether the Recipient exists.
- **FR-071**: THE Notification Engine SHALL provide admin-area endpoints to list, add and remove Suppression List entries, each change audited.

#### Push device tokens

- **FR-072**: THE Notification Engine SHALL provide app-area endpoints to register and remove a device push token for the authenticated Recipient, with the provider kind and platform.
- **FR-073**: WHEN a token already registered to another Recipient is registered, THE Notification Engine SHALL move it to the new Recipient.
- **FR-074**: WHEN a provider reports a token unregistered or invalid, THE Notification Engine SHALL delete the token and mark that Delivery `failed` with reason `device_unregistered`.

#### Tenancy, security, privacy and audit

- **FR-075**: THE Notification Engine SHALL store every record in tenant-owned tables with `tenant_id` and forced row-level security, and SHALL run every query inside the tenant context resolved from the authenticated principal.
- **FR-076**: THE Notification Engine SHALL use UUIDv7 primary keys and expose only prefixed base32 public ids at the boundary.
- **FR-077**: THE Notification Engine SHALL place endpoints in the API areas `public` (provider webhooks, unsubscribe; signed, unauthenticated), `app` (inbox, own preferences, device tokens), `admin` (tenant templates, defaults, suppressions, delivery log, preview) and `platform` (instances, rate limits, dead letters).
- **FR-078**: THE Notification Engine SHALL classify every stored and emitted field as `internal`, `confidential` or `pii`, and SHALL redact `pii` fields (addresses, phone numbers, device tokens, rendered content, variables) from logs, events, errors and dead-letter reasons.
- **FR-079**: THE Notification Engine SHALL NOT persist rendered message bodies after a Delivery reaches a terminal or post-send state, except Inbox Item content, which the in-app channel requires.
- **FR-080**: WHEN a Template Override, tenant preference default, Suppression List entry, Rate Limit Policy or Driver Instance assignment changes, or a dead letter is replayed, THE Notification Engine SHALL emit an audit record with the full Actor chain, tenant, target, before and after references and correlation id.
- **FR-081**: WHEN a Recipient erasure request is processed, THE Notification Engine SHALL erase that Recipient's inbox items, preferences, device tokens and digest buffer, anonymise their delivery records, and keep suppression entries only as a one-way hash.
- **FR-082**: THE Notification Engine SHALL delete records past their retention period through a scheduled purge job, with these defaults configurable per record kind: deliveries and state history 90 days, inbox items 180 days after creation, archived inbox items 30 days after archiving, raw provider webhook payloads 7 days, audit records 1 year, suppression entries until removed.

#### Deploy modes and the remote seam

- **FR-083**: THE Notification Engine SHALL run in `saas`, `on_prem` and `air_gapped` Deploy Modes with no dependency on a specific cloud provider.
- **FR-084**: WHERE the Remote Driver is configured, THE Notification Engine SHALL forward the public interface to a hosted notifications service using the wire contract in `@stackra/notifications/contracts`, authenticated by a service token reference.
- **FR-085**: THE Notification Engine SHALL publish its event payloads and the remote wire contract as versioned types in the types-only `@stackra/notifications/contracts` entry, built on `@stackra/contracts` primitives and containing no runtime code.
- **FR-086**: THE Notification Engine SHALL expose delivery status events and a routing strategy interface sufficient for a Pro delivery-analytics dashboard and Pro multi-provider failover to be added without changing the package.

#### Actions, actors, settings and module contributions

- **FR-087**: THE Notification Engine SHALL expose every operation as an Action that declares its allowed Actor types and a Risk Level, and SHALL authorise each Action through `@stackra/iam` `check()` before it runs.
- **FR-088**: THE Notification Engine SHALL declare at least these Risk Levels: `L0` for inbox reads, unread count, preview and delivery-log reads; `L1` for a Recipient's own inbox status changes, Preferences and device tokens; `L2` for send, Tenant Notification Settings changes, Template Override saves and Suppression List changes; `L3` for dead-letter replay and platform Driver Instance or Rate Limit Policy changes; `L4` for Recipient erasure.
- **FR-089**: IF an agent Actor invokes an `L2` Action and the tenant has not waived approval for it, THEN THE Notification Engine SHALL NOT run the Action until it is approved through the action pipeline.
- **FR-090**: IF an `L3` or `L4` Action has no named human approver in its Actor chain, THEN THE Notification Engine SHALL reject it with `permissionDenied`.
- **FR-091**: THE Notification Engine SHALL record the Actor chain on every Notification, audit record and published event envelope, using the `@stackra/contracts` Actor and EventEnvelope types.
- **FR-092**: THE Notification Engine SHALL run digest flushes and quiet-hours releases as `@stackra/scheduler` cron or delayed `@stackra/queue` jobs that dispatch Actions, and SHALL place a workflow behind an Action only when the Action meets the workflow criteria.
- **FR-093**: THE Notification Engine SHALL read every per-tenant notification setting through `@stackra/settings`, resolved along the scope chain default → platform → tenant → user and honouring locks.
- **FR-094**: IF a Driver Instance's `@ConnectionRef` Connection is missing or revoked when a Delivery is processed, THEN THE Notification Engine SHALL mark the Delivery `failed` with reason `connection_unavailable` and dead-letter it for replay.
- **FR-095**: THE notifications module SHALL contribute its own settings (`@Settings`), widgets (an unread-count widget and an admin delivery-status widget), admin resources (Template Overrides, Suppression List, Deliveries, dead letters) and client tools (`L0` UI-only, such as open inbox and open preferences) from its own entries, with nothing registered in a central place.

### Out of scope

- Visual template editor UI, delivery analytics dashboard, multi-provider failover routing (Pro; seams in FR-016, FR-032, FR-086).
- UI components for inbox or preferences (headless hooks only).
- The deployable notifications service (Figentra OS repo).
- Scheduled "send at" a future time and cancellation of accepted sends, beyond holds for quiet hours, digests and rate limits.
- Inbound email processing; voice calls; web push (browser) — candidates for a later spec.

### Key Entities

- **Notification Type** (code, not stored): key, category, allowed channels, variable schema, priority, digest settings, bypass-quiet-hours, expiry.
- **Notification**: tenant, type key, recipient id, idempotency key, correlation id, Actor chain, created time; has many Deliveries.
- **Delivery**: notification, channel, driver instance, masked contact point, current state, attempts, provider message id, reason; has a state history.
- **Inbox Item**: tenant, recipient, notification, category, rendered title/body/action, status (unread/read/archived), read and archived timestamps.
- **Preference**: tenant, recipient, category, channel, enabled. Tenant defaults are Tenant Notification Settings, not rows here.
- **Suppression Entry**: tenant, channel, contact point (hash after erasure), reason, source, created time.
- **Digest Buffer Entry**: tenant, recipient, channel, digest key, notification, window end.
- **Device Token**: tenant, recipient, provider kind, platform, token, last seen.
- **Template Override**: tenant, type key, channel, locale, source, version, author.
- **Rate Limit Policy**: driver instance, rate, burst (platform configuration); per-tenant overrides are Tenant Notification Settings.
- **Raw Provider Webhook**: tenant (when resolvable), provider, provider event id, received time, signature result, payload (kept 7 days).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A developer new to the package declares a notification type and delivers a first email and in-app notification in under 30 minutes following the package guide.
- **SC-002**: Under forced duplicate requests and duplicate job redelivery, 100% of idempotency-key duplicates produce exactly one provider send in the conformance and integration tests.
- **SC-003**: An in-app notification reaches an online recipient's open session within 2 seconds at the 95th percentile.
- **SC-004**: 100% of shipped Channel Drivers pass the Conformance Suite in a CI job with outbound network disabled.
- **SC-005**: Zero opted-out, unconsented or suppressed recipients receive a non-mandatory notification across the preference, consent and suppression test matrix.
- **SC-006**: Zero non-bypass deliveries are sent inside quiet hours across a test matrix of at least 10 timezones including two daylight-saving transitions.
- **SC-007**: After a simulated one-hour provider outage, 100% of affected deliveries end either sent or dead-lettered with a reason; none are lost.
- **SC-008**: A redaction test corpus of logs, events, errors and dead-letter reasons contains zero PII values.
- **SC-009**: Tenant isolation tests show tenant B receives zero rows or `notFound` for every read and write on tenant A's notifications, deliveries, inbox items, preferences, suppressions and templates.
- **SC-010**: A one-click unsubscribe takes effect for the next send in that category, with no login, in 100% of tests.
- **SC-011**: Switching a Host from the local Engine to the Remote Driver passes the same public-interface test suite unchanged.

## Assumptions

- The messaging-layer packages (`@stackra/events`, `outbox`, `queue`, `scheduler`, `realtime`, `webhooks`) and `@stackra/consent`, `i18n`, `tenancy`, `container`, `config`, `logger` are built (ported) before or alongside this package; none exists in the repo today. The plan must sequence against them and may not re-implement any of them.
- The 24-hour idempotency window and per-tenant scope follow the HTTP and events law of the constitution.
- Retry defaults: 5 attempts, exponential backoff from 30 seconds with full jitter, capped at 1 hour; configurable per instance.
- Mandatory categories bypass preferences, unsubscribe, complaint and STOP suppression (receipts, security alerts and OTP must still reach the person), but respect hard-bounce and invalid-address suppression (sending to a dead address harms sender reputation). Carrier-level STOP blocking may still stop an SMS; that Delivery then fails with the provider's reason.
- Quiet hours apply by default to push, SMS and WhatsApp only; email and in-app are not interruptive.
- Open and click tracking is off by default (GDPR data minimisation) and opt-in per tenant and category.
- Suppression lists are per tenant; a platform-wide suppression layer is not in scope.
- In air-gapped mode, channels that inherently need the public internet (Expo push, FCM, APNs, cloud SMS/WhatsApp, Resend) are unavailable by design; SMTP to an internal relay, an on-prem SMS gateway and in-app remain.
- The notification-level priority does not override Mandatory Category rules; bypass of quiet hours and digests is a type-level declaration.
- Unsubscribe tokens do not expire; they are invalidated by rotating the signing key.
- Recipient contact points, locale and timezone are resolved by the Host through a recipient-resolver interface; the package does not own user profiles.
- Recipient Preferences stay a notifications table rather than user-scope settings, because categories are code-declared per type and the unsubscribe, STOP and consent paths write them; tenant defaults are settings.
- The Risk Levels in FR-088 are minimums; the package design ADR may raise any of them.
- Actor types per Action: provider webhooks run as `webhook`, one-click unsubscribe as `anonymous` via `http` with a signed token, digest flushes and releases as `job` or `cron`, and sends from agents as `agent` with the onBehalfOf chain.
- Delivery plan (D13): one spec, one Linear project, one PR per user story, with US1 and US2 first; each later story lands as its own PR in priority order.
- Specs move from `specs/` to `.agents/specs/` (D1) when the SDLC Phase 0 preset wrap lands; until then this spec stays at its current path.

## Open items

All owner questions are answered; the decisions are recorded under Clarifications and applied above. Linear: project Notifications, spec issue STA-35.

1. **ADRs before `/speckit.plan`.** The ADRs listed under Impact (package design, ADR 0015 amendment, runtime/codegen in PR #16, settings and connections) should be accepted before the plan relies on them.

## Status history

- 2026-10-19 · — → Draft · Claude (lead) · created (supersedes PR #14)
- 2026-10-20 · Draft → Clarified · owner · every owner question answered (see Clarifications); line backfilled for spec-gate v2 (STA-163)
