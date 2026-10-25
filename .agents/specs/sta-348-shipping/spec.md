# Feature Specification: `@stackra/shipping`, carrier ports, tracking states, label documents and dimensional weight

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete (defaults applied in owner mode; see Open items)

**Input**: Build `@stackra/shipping` (commerce, new package, Stackra ADR 0369). Row of
`notes/handover/stackra-package-needs.md`: "Carrier port contracts (rate quote, label, pickup, cancel), tracking-state
normalisation, label documents (PDF and ZPL), dimensional weight; drivers stay OS integrations connectors"; asked by
Commerce (shipping), COM-147 to COM-159.

## Impact

- **Apps touched**: none
- **Services touched**: none (the Commerce shipping module and OS integrations connectors are the consumers)
- **Packages touched**: `packages/commerce/shipping` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (no table; ports and pure functions)
- **Secrets**: none
- **ADR needed**: yes, ADR 0369 (Proposed), written in this change
- **New dependencies**: none (workspace `@stackra/contracts`, `@stackra/errors`, `@stackra/money`)
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT)
- **Docs to update**: the package README and AGENTS; the ADR index (integrator)
- **Lane**: lite
- **Change risk**: R2 (new public contract every carrier connector implements)

## Clarifications

Owner rule applied: configuration, not code (ADR 0363). From `answers-as-config.md`: COM-147 carriers per market are
pack data (CAP-shipping, CAP-provider-per-market); COM-149 rates are `rule-set:commerce:shipping-rates`; COM-153,
COM-156 and COM-158 are CAP-shipping; COM-157 restrictions a rule set; COM-159 a workflow template. So the package holds
no carrier, factor, increment or tracking code. Conflicts #2, #3, #4 and #6 of the package-needs file do not touch this
package. Commerce conflict 2 (shipping resale, COM-148) is a money-stream question; the port is the same either way.

## User Scenarios & Testing

### User Story 1 - Buy a label from the tenant's carrier (Priority: P1)

The shipping module asks `CarrierGateways` for a gateway with `labels` in the tenant's Market and buys a label; a retry
with the same reference returns the same shipment.

**Independent Test**: `src/contracts/ports/__tests__/carrier-gateways.port.test.ts`,
`src/core/functions/__tests__/has-capability.function.test.ts`, `src/contracts/__tests__/index.test.ts`.

### User Story 2 - Show one tracking state whatever the carrier (Priority: P1)

Polled and webhook events of any carrier become one timeline with a current state.

**Independent Test**: `src/core/functions/__tests__/normalise-tracking.function.test.ts`.

### User Story 3 - Print labels (Priority: P1)

A connector's label is checked before storage; a warehouse prints a batch of ZPL labels as one job.

**Independent Test**: `label-document.function.test.ts`, `batch-zpl.function.test.ts`.

### User Story 4 - Bill the right weight (Priority: P2)

The rate rule set reads the chargeable weight of a parcel from the carrier's factor and increment.

**Independent Test**: `dimensional-weight.function.test.ts`, `chargeable-weight.function.test.ts`.

### Acceptance Scenarios

1. **Given** a gateway listing `pickups`, **When** `hasCapability(gateway, "pickups")`, **Then** true and the gateway
   narrows to `PickupGateway`; for `labels`, false.
2. **Given** events out of order across offsets, **When** normalised, **Then** they are ordered by instant and the
   state is the latest event's; a late older event does not move it back.
3. **Given** the same code at the same instant twice, **Then** it appears once; **given** a code missing from the map,
   **Then** it is listed in `unmapped` once and not mapped.
4. **Given** bytes claimed as PDF that are ZPL, or text that is not base64, **Then** `label_document_invalid` with
   reason `signature` or `not_base64`.
5. **Given** two ZPL labels, **Then** `batchZpl` returns one ZPL document with both in order; a PDF label is refused.
6. **Given** a 400 × 300 × 200 mm box of 2 500 g and a factor of 4 000, **Then** dimensional weight is 6 000 g and the
   chargeable weight 6 000 g; with 9 001 g and an increment of 500, 9 500 g.

### Edge Cases

- An event instant that is not a date is a `RangeError`.
- A tracking code equal to an object prototype key (`toString`) is unmapped, not resolved from the prototype.
- A non-whole or non-positive dimension, weight, increment, or a non-finite factor is a `RangeError`; a volume past the
  safe integer limit too.

## Requirements

- **FR-001**: `@stackra/shipping` at `packages/commerce/shipping`, `tier:lib`, entries `./contracts` and `.`.
- **FR-002**: The carrier contract SHALL be capability interfaces (rates, labels with cancel, pickups with cancel,
  tracking with its map) on a `CarrierGateway`, narrowed by `hasCapability`.
- **FR-003**: `CarrierGateways` SHALL answer a gateway per Market and needs, all such gateways, or a stored connection;
  no match is `NoCarrierError` (`no_carrier`).
- **FR-004**: `TrackingState` SHALL be one model with terminal flags; `normaliseTracking` SHALL map, deduplicate, order
  and report unmapped codes as above.
- **FR-005**: `labelDocument` SHALL check PDF and ZPL envelopes from bytes or base64; `batchZpl` SHALL join ZPL labels.
- **FR-006**: `dimensionalWeight` and `chargeableWeight` SHALL take the factor and increment as inputs, with no
  default factor.
- **FR-007**: No carrier, Market, factor, increment, rate, stock or tracking code SHALL appear in source.

## Success Criteria

- **SC-001**: Spec, plan, tasks, ADR 0369 and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/` (owner mode: written, not run).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package.

## Open items (for the owner, not blocking)

- Pickup-point and locker search (COM-156) is not in the port yet (ADR 0369 open question 1).
- Return labels (ADR 0369 open question 3) wait for the returns module spec.
- No `./testing` fake: consumers bind an object literal until a connector needs a shared fake.
- PDF batch merging belongs to `@stackra/documents`.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · owner mode (develop now, test later)
