# Feature Specification: `@stackra/notifications` wave 4, notifications and mail bodies

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/notifications` (communication, wave 4) for real: the `Notification({ category })` kind base
the template's order notifications extend, `Recipient`, the `Notifier` port with a memory driver, the `MailTransport`
port the notifications service's drivers implement, and the `.mail.tsx` rendering (`useMail`, `MailProps`,
`renderMail`). The package was `@stackra/mail` (ADR 0294 decision 23). This supersedes, for the package, the
service-engine scope of `sta-35-notifications`, which stays the design note of the notifications service.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce and notifications services consume it once converted, STA-344)
- **Packages touched**: `packages/communication/notifications` (new member)
- **Cross-service events**: none; the package publishes nothing (gen's listener calls the `Notifier`)
- **Tenancy and data**: none; the package stores nothing. A scope recipient keeps the scope's id only (R-59)
- **Secrets**: none; mail provider credentials belong to the notifications service's drivers
- **ADR needed**: no (ADR 0223 as amended by 0294, ADR 0266 and owner decision R-26 settle the shape)
- **New dependencies**: none outside existing catalogs; runtime edges to `@stackra/assets`, `@stackra/config`,
  `@stackra/container`, `@stackra/contracts`, `@stackra/i18n`, `@stackra/money`, `@stackra/validation` and `zod`;
  React and React DOM (catalog `frontend`) as optional peers
- **Deploy modes**: same in all; no network, the memory driver only, rendering in process
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/communication/notifications/README.md`, `packages/communication/notifications/AGENTS.md`; ADR 0086, 0223, 0266, 0294 and 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract that every notification, mail body and mail transport driver uses)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR
0294, 0305). The choices recorded when it was specified:

- Owner R-26: no runtime template engine. A mail body is a `.mail.tsx` class component, compiled by gen and rendered
  with `react-dom/server` to HTML and a derived text part.
- Owner answer to registry Q4: the old `./mail` entry folds into a standard one. The template already imports
  `MailProps` and `useMail` from `./react`, so both live there (the consumer contract wins over placing `MailProps`
  in `.`).
- ADR 0266: the transport is a port. The package ships `MailTransport` and a test double; its drivers live in the
  notifications service. The `Notifier` ships its `memory` driver; the `notifications` driver, which queues rendered
  mails to the notifications service, waits for `@stackra/clients`.
- R-59 and the coordinator's ADR 0327 note: a `Recipient` is a principal's public id or a scope's id, never a level.
- No `@stackra/actions` edge: nothing here needs it; gen's listener runs the notification after commit.

## User Scenarios & Testing

### User Story 1 - Declare a notification (Priority: P1)

A module author writes `OrderReceiptNotification extends Notification({ category: NotificationCategory.Transactional
})` with `recipients(event: OrderPaid)`, `data(event)` and `mail(data, mail)`; gen's listener hands it to the bound
`Notifier` once per event.

**Independent Test**: `packages/communication/notifications/src/core/bases/__tests__/notification.base.test.ts`,
`packages/communication/notifications/src/core/functions/__tests__/prepare-notification.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the receipt notification, **When** it is prepared for an event naming a customer twice, **Then** one
   delivery per distinct recipient carries the category, the data read once and the mail subject key.
2. **Given** a bare `extends Notification` or no `recipients`, **When** it is compiled, **Then** it fails.

### User Story 2 - Assert what was sent (Priority: P1)

A test binds the memory drivers and reads `(app.get(Notifier) as MemoryNotifier).sent(OrderReceiptNotification)`.

**Independent Test**: `packages/communication/notifications/src/core/drivers/__tests__/memory-notifier.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** two notifications sent, **When** `sent(OrderReceiptNotification)` is read, **Then** only the receipt's
   delivery is returned, with `Recipient.principal(customerId)`.

### User Story 3 - Write and test a mail body (Priority: P1)

A module author writes `OrderReceiptMail extends Component<MailProps<typeof OrderReceiptNotification>>` with
`mail = useMail()`, and a test renders it with `renderMail(OrderReceiptMail, data, { locale: "ar" })`.

**Independent Test**: `packages/communication/notifications/src/react/mail/__tests__/render-mail-body.function.test.tsx`,
`packages/communication/notifications/src/testing/functions/__tests__/render-mail.function.test.tsx`.

**Acceptance Scenarios**:

1. **Given** Arabic catalogues, **When** the receipt renders with two and three lines, **Then** the text has the dual
   and `few` plural forms and the HTML has `dir="rtl"`.
2. **Given** only a locale, **When** `renderMail` runs in a member root, **Then** it reads the base language's lang
   files and the regional overlay.

### User Story 4 - Implement a mail transport (Priority: P2)

The notifications service writes `MemoryMailTransportDriver extends Driver(MailTransport)` and a test swaps in a
double.

**Independent Test**: `packages/communication/notifications/src/contracts/ports/__tests__/mail-transport.port.test.ts`.

### Edge Cases

- A notification with no recipient for an event: nothing is sent and `data` is not read.
- A notification without `data`: the event is the data; without `mail`: no mail channel.
- A `mail()` that sets no subject, a recipient that is not a `Recipient`, a class of another kind: `TypeError`.
- A body that translates a key the catalogues lack: `RangeError`, never the raw key.
- `useMail()` outside a mail render: an error, never a default locale.
- A regional locale with no overlay folder: the base language alone.

## Requirements

- **FR-001**: The package SHALL be `@stackra/notifications` at `packages/communication/notifications`, `tier:lib`,
  with entries `.`, `./contracts`, `./react` and `./testing` only, and runtime dependencies on workspace packages and
  catalog versions only.
- **FR-002**: `.` SHALL export `Notification`, `NotificationCategory`, `Notifier`, `Recipient` and the type
  `MailMessage` in the shapes the template uses; `Notification` SHALL be called only, record its category, and let a
  subclass declare `data` and `mail` without `override`.
- **FR-003**: Preparing a notification SHALL yield one frozen delivery per distinct recipient with the category, the
  data read once (none read for no recipient) and the mail message, and SHALL refuse a class of another kind, a value
  that is not a `Recipient` and a mail without a subject.
- **FR-004**: `MemoryNotifierDriver` SHALL implement `Notifier`, keep deliveries per instance in send order and filter
  them by notification class; `NotificationsConfig` (key `notifications`) SHALL pick the driver, defaulting to
  `memory`.
- **FR-005**: `./contracts` SHALL export the `MailTransport` port and the `OutboundMail` type.
- **FR-006**: `./react` SHALL export `useMail` (locale, direction, `t`, `money`, `asset`) and the type `MailProps`;
  the renderer SHALL produce an XHTML document and its text part with no template engine.
- **FR-007**: `./testing` SHALL export `renderMail`, the type `MemoryNotifier` and `MailTransportFake`; `renderMail`
  SHALL read the member's lang files for the locale unless catalogues are passed.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and `validate-repository` reports nothing for it.

## Open items (for the owner, not blocking)

- The `notifications` `Notifier` driver (in `./node`, queueing `messages.message.send@1` with the rendered parts) needs
  `@stackra/clients`; the template's committed gen samples already name it and `"notifications" | "memory"`, so they
  change to `"memory"` until it ships.
- Gen must render each body in the recipient's locale at send time, which needs the principal's language: today
  `IdentityResolver` in `@stackra/contracts` answers an address only.
- The production renderer needs the member's catalogues at run time; `renderMail` reads lang files from the working
  directory for tests only.
- `htmlToText` covers the markup React Email components render; `@react-email/render`'s converter would add column
  layout for tables, at the cost of a new dependency.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package written in owner mode (develop now, test later)
