# Feature Specification: `@stackra/payments`, gateway ports, the payments engine mechanism and provider drivers

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348 (row of `notes/handover/stackra-package-needs.md`; STA-435)

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/payments` (commerce, approved by ADR 0357 and ADR 0358 decision 3): gateway port (capture,
refund, void, payout), payment session, pay links, saved tokens with a merchant-initiated-charge capability flag, the
`unknown` state, disputes, terminal session and a tip line with a terminal tip prompt (XP-6 answered); drivers
Checkout.com, Moyasar, HyperPay, Paymob, Fawry, Stripe and Connect, Tabby, Tamara; Geidea and Network International
terminals. Provider choice per Market comes from market-pack data, never from code.

## Impact

- **Apps touched**: none
- **Services touched**: none (the OS payments and payments-ledger services build on it later)
- **Packages touched**: `packages/commerce/payments` (new member)
- **Cross-service events**: none here
- **Tenancy and data**: no tables; `PaymentRecords` is a port the host backs; Connections are read through
  `@stackra/integrations`' `ConnectionStore`, which applies the scope
- **Secrets**: provider keys are connection `@Secret` fields, resolved blind; none is read, logged or committed here
- **ADR needed**: no (ADR 0357, 0358 d3, 0356, 0359 d11, 0308, 0220)
- **New dependencies**: none new; workspace packages only
- **Deploy modes**: same in all; drivers call only their Integration's base URL
- **Licence tier**: free (MIT)
- **Lane**: full (a new package)
- **Change risk**: R3 (moves money once a service runs it; nothing runs it yet)

## Clarifications

### Session 2026-10-25

- Configuration, not code (owner, 2026-10-25): Markets, providers per Market, fees, caps, tip presets and capture
  timing are data, settings or rules; the package holds ports, drivers and the engine mechanism only.
- The driver is the provider's `Connection` (ADR 0356 decision 2): each connection class implements the gateway ports
  it supports; `PaymentGateways` picks the Connection.
- Conflicts settled per `stackra-package-needs.md`: loyalty points stay on `@stackra/loyalty-kit` (#6), so this package
  has no loyalty account kind.
- Terminals: Stripe Terminal (server-driven) ships now. Geidea and Network International terminals are semi-integrated
  over a local link and wait for the `CardTerminal` port of `@stackra/peripherals` (not on disk).

## User Scenarios & Testing

### User Story 1 - A product takes a hosted payment (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a Market whose data lists providers, **When** `checkout(market, request)` runs, **Then** the tenant's own
   Connection of the first provider with every needed capability serves it, else the Market's platform Connection.
2. **Given** an open, unexpired checkout, **When** the same reference checks out again, **Then** the same session
   returns; **When** it was paid, **Then** `InvalidPaymentTransitionError`.
3. **Given** a pay link, **When** it is sent again before expiry, **Then** the same URL returns.

### User Story 2 - A lost answer never causes a double charge (Priority: P1)

1. **Given** a provider call whose answer is lost, **Then** the payment is `unknown` and every action is refused with
   `PaymentUnknownError` until `reconcile` looks it up or a manager resolves it with a reason.
2. **Given** a retried charge with a used reference, **Then** the record returns and no second charge is made.

### User Story 3 - Saved tokens and merchant-initiated charges (Priority: P1)

1. **Given** a token without the merchant-initiated flag, **When** the merchant charges it, **Then**
   `MerchantInitiatedNotAllowedError`.

### User Story 4 - Capture, void, refund, payouts, platform, disputes, terminal with tip (Priority: P2)

1. Capture and void need `PaymentCapability.Capture`, else `CapabilityUnsupportedError`.
2. Refunds never exceed what was taken and move the state to partly or fully refunded.
3. A terminal payment with a tip prompt keeps the tip apart on the record; a cancel reads the final state.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./testing`; `./contracts` imports no other entry.
- **FR-002**: Gateway ports `PaymentGateway`, `CaptureGateway`, `TokenGateway`, `PayoutGateway`, `PlatformGateway`,
  `DisputeGateway`, `TerminalGateway`; container ports `PaymentGateways`, `MarketPaymentDefaults`, `PaymentRecords`.
- **FR-003**: `PaymentService` with checkout, pay links, charge, terminal start and cancel, reconcile, capture, void,
  refund and manual resolve, applying the `unknown` state.
- **FR-004**: Drivers for Stripe (with Connect, disputes and Terminal), Checkout.com, Moyasar, HyperPay, Paymob, Fawry,
  Tabby and Tamara, each an Integration and a Connection, calling only through the managed client.
- **FR-005**: No Market, country, provider choice, fee, cap or tip preset in code.

## Success Criteria

- **SC-001**: Every public symbol has a unit test beside it.
- **SC-002**: A changeset adds the package.
- **SC-003**: Tests, typecheck and build pass in the separate testing workflow (owner mode: not run here).
