# Feature Specification: `@stackra/pricing`, pricing primitives on money

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (registry row: "pricing primitives; the engine is the OS service", exports none
named, depends on money; A9: the old `@PriceModel` is not a kind and needs an ADR before any kind is added)

**Input**: Build `@stackra/pricing` (commerce, wave 2) for real: primitives only, on `@stackra/money`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the OS pricing service consumes it later)
- **Packages touched**: `packages/commerce/pricing` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (values only)
- **Secrets**: none
- **ADR needed**: no (ADR 0244 decision 6 decides price points per market; ADR 0242 decision 2 decides metered usage
  over an included amount; ADR 0127 places pricing primitives in commerce). A pricing kind would need one; none is
  added.
- **New dependencies**: none; `@stackra/money` and `@stackra/contracts` through `workspace:*`
- **Deploy modes**: same in all; isomorphic, no clock, locale, environment or network read
- **Lane**: full (a new package)
- **Change risk**: R3 (money arithmetic: a wrong point or band is a charging defect)

## Consumer contract

The template (`stackra-template-preview`, main) imports nothing from `@stackra/pricing`; the registry row names no
export. The surface is therefore the smallest set of primitives the accepted ADRs call for, and the barrel test pins it.

## User Scenarios & Testing

### User Story 1 - Round a computed price onto a market's price point (Priority: P1)

The pricing service adjusts a base price list (ADR 0244 decision 2) and rounds each result to the market's price point
(decision 6) with `PricePoint.ofMinor(100, 99, "USD").apply(price)`.

**Independent Test**: `src/core/values/__tests__/price-point.value.test.ts`.

**Acceptance Scenarios**:

1. **Given** the point (100, 99, USD) and 12.34, **When** `apply` runs with the default, **Then** it returns 12.99;
   with `Down` 11.99; with `HalfEven` 11.99 (the nearest).
2. **Given** a tie (12.49, halfway between 11.99 and 12.99), **When** `HalfUp` runs, **Then** it takes 12.99;
   `HalfEven` takes the point with the even `k`.
3. **Given** a price at or below the first point (0.10), **When** any mode runs, **Then** it returns 0.99; **given**
   zero, **Then** it returns zero.
4. **Given** a negative price or a price in another currency, **Then** `apply` throws a `RangeError`.

### User Story 2 - Charge metered usage over an included amount (Priority: P1)

Billing prices AI credits, messages, automation runs or API calls in bands, the first at zero (ADR 0242 decision 2),
with `GraduatedPrice.of(tiers).total(quantity)`.

**Independent Test**: `src/core/values/__tests__/graduated-price.value.test.ts`.

**Acceptance Scenarios**:

1. **Given** bands (≤1 000 free, ≤10 000 at 0.02, then 0.01), **When** `total(12 000)` runs, **Then** it returns
   200.00; `total(1 000)` is 0 and `total(1 001)` is 0.02.
2. **Given** an empty list, an open band before the last, a bounded last band, bounds that do not ascend or mixed
   currencies, **When** `of` runs, **Then** it throws a `RangeError`.
3. **Given** a negative or fractional quantity or a total beyond the safe-integer limit, **Then** `total` throws a
   `RangeError`.

### Edge Cases

- `PricePoint` ending 0 rounds to whole steps (tens of dollars with step 1 000).
- Currencies with other exponents (JPY 0, KWD 3) use their own minor units.
- A unit cheaper than one minor unit is priced per block by the caller (thousands of calls).

## Requirements

- **FR-001**: The package SHALL be `@stackra/pricing` at `packages/commerce/pricing`, `tier:lib`, entry `.` only.
- **FR-002**: `.` SHALL export `PricePoint`, `GraduatedPrice` and the type `PriceTier`, and nothing else.
- **FR-003**: `PricePoint.ofMinor(step, ending, currency)` SHALL refuse a non-positive or unsafe `step`, an `ending`
  outside 0 to `step - 1` and an unknown currency; `apply(price, rounding = Up)` SHALL return the point chosen by the
  rounding, computed only through `Money`.
- **FR-004**: `GraduatedPrice.of(tiers)` SHALL check the bands; `total(quantity)` SHALL be exact (no rounding).
- **FR-005**: No kind, decorator or registry SHALL be added (registry A9).
- **FR-006**: Dependencies SHALL be `@stackra/money` and `@stackra/contracts` (`workspace:*`) only.
- **FR-007**: Every source file SHALL carry the Stackra file contract, one exported declaration per file, TSDoc on
  every export; tests SHALL sit in `__tests__/` beside the subject and import from `@stackra/testing`.

## Success Criteria

- **SC-001**: The barrel test pins the export list (FR-002) and fails when an export is added or removed.
- **SC-002**: Each acceptance scenario above has a unit test.
- **SC-003**: `PriceTier` has type tests (bounded, open, read-only, refused shapes).

## Assumptions

- Value classes live at `src/core/values/`, following `@stackra/money`; the kind-path table (STA-338) settles the name.
- `apply` rounds up by default so a market price never undercuts the computed list price.
