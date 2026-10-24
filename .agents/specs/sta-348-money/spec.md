# Feature Specification: `@stackra/money` wave 1b, money in minor units and its codecs

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (owner, 2026-10-24: the money codecs ship from `@stackra/money`, which joins
wave 1b and depends only on `@stackra/contracts` and zod)

**Input**: Build `@stackra/money` (commerce, wave 1b) for real: `Money` in minor units, ISO 4217 currency codes,
rounding modes, exact allocation, and the `money()` and `currencyCode()` codecs that generated schemas import.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service, web, mobile and console apps consume it, STA-344)
- **Packages touched**: `packages/commerce/money` (new member; first member of the `commerce` category)
- **Cross-service events**: none (the wire form of `Money` is `{ minor, currency }`)
- **Tenancy and data**: none (values only; the two columns are the model package's job)
- **Secrets**: none
- **ADR needed**: no (ADR 0220 decides the representation and rounding; ADR 0127 places money in commerce and, in its
  2026-10-24 note, moves the codecs here; ADR 0294 decisions 26 and 27 fix `Money.of` and the safe-integer limit)
- **New dependencies**: none new; `zod` from the default catalog (4.6.7, already pinned), `@stackra/contracts`
  through `workspace:*`
- **Deploy modes**: same in all; isomorphic, no clock, locale, environment or network read
- **Lane**: full (a new package)
- **Change risk**: R3 (money arithmetic: a wrong rounding or a lost minor unit is a payment defect)

## User Scenarios & Testing

### User Story 1 - Hold a price as minor units and show it as a decimal (Priority: P1)

A route builds `Money.ofMinor(minor, product.currency).toDecimal()` for a JSON-LD offer price, and a seeder or
factory builds `Money.ofMinor(1_000, "USD")` for a model field typed `Money`.

**Independent Test**: `src/core/values/__tests__/money.value.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Money.ofMinor(1250, "USD")`, **When** `toDecimal()` runs, **Then** it returns `"12.50"`; JPY has no
   fraction digits and KWD has three (ADR 0220 decision 2).
2. **Given** a minor amount that is not a safe integer (above `Number.MAX_SAFE_INTEGER`, fractional, `NaN`),
   **When** `Money.ofMinor` runs, **Then** it throws a `RangeError` (ADR 0294 decision 27).
3. **Given** a currency that is not an ISO 4217 code with minor units (`"usd"`, `"XXX"`), **When** a constructor
   runs, **Then** it throws a `RangeError`.

### User Story 2 - Divide for display without advertising a rounded-up price (Priority: P1)

The pricing table shows a yearly price per month with
`Money.ofMinor(priceMinor, currency).divide(12, Rounding.Down)`.

**Acceptance Scenarios**:

1. **Given** 10 000 minor divided by 12, **When** rounding is `Down`, **Then** the result is 833; with `HalfEven`
   (the default) it is 833; 1 000 by 8 is 125 exactly.
2. **Given** an exact half, **When** the rounding is `HalfEven`, **Then** it rounds to the even neighbour; `HalfUp`
   rounds away from zero; `Up` rounds any remainder away from zero; `Down` truncates toward zero.

### User Story 3 - Split an amount with no lost minor unit (Priority: P2)

A ledger or a refund splits an amount by ratios with `allocate([...])`; the parts always sum to the whole and the
remainder goes deterministically to the largest fractional parts, earlier index first (ADR 0220 decision 3).

### User Story 4 - Generated schemas decode and encode money (Priority: P1)

Generated `#stackra/schemas` and clients write `currency: currencyCode()`, `defaultCurrency: currencyCode().default("USD")`
and `subtotal: money()`, and their `X$Check` asserts `z.output<typeof X$>` equals the class fields
(`CurrencyCode`, `Money`).

**Independent Test**: `src/core/functions/__tests__/money.function.test.ts`,
`src/core/functions/__tests__/currency-code.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the wire value `{ minor: 1250, currency: "USD" }`, **When** `money()` parses it, **Then** it returns a
   `Money`; **When** `z.encode(money(), value)` runs, **Then** it returns the wire value.
2. **Given** a wire minor above `Number.MAX_SAFE_INTEGER` or an unknown currency, **When** `money()` parses it,
   **Then** parsing fails.
3. `z.output<ReturnType<typeof money>>` is exactly `Money`; `z.output<ReturnType<typeof currencyCode>>` is exactly
   `CurrencyCode`.

### Edge Cases

- Mixed currencies in `plus`, `minus` or `Money.max`: refused with a `RangeError`.
- A factor or divisor given as a JavaScript number (`0.145`, `1e-7`) is read as the decimal it prints as, and the
  arithmetic is exact (BigInt), so `0.145 × 100` is 14.5 before rounding, never 14.4999….
- Division by zero, a non-finite factor, a negative or all-zero allocation ratio: `RangeError`.
- A result above `Number.MAX_SAFE_INTEGER`: `RangeError`, never a silently rounded number.
- `-0` minor is stored as `0`.
- `Money.of("1.234", "USD")` (more fraction digits than the currency has): `RangeError`, never a silent rounding.

## Requirements

- **FR-001**: The package SHALL be `@stackra/money` at `packages/commerce/money`, `tier:lib`, entry `.` only
  (registry row; ADR 0127 and its 2026-10-24 note; ADR 0294 decision 15).
- **FR-002**: `.` SHALL export `Money`, `Rounding`, `money`, `currencyCode` and the type `CurrencyCode`, and nothing
  else (template imports with the Q5 move applied).
- **FR-003**: `CurrencyCode` SHALL be the union of the ISO 4217 codes that have minor units, so `"USD"` is
  assignable and `"usd"` is not (template: `defaultCurrency: CurrencyCode = "USD"`).
- **FR-004**: `Money` SHALL expose `minor: number` and `currency: CurrencyCode` (template: `line.unitPrice.minor`,
  `@Index(["tenantId", "total.minor"])`, columns `<name>_minor` and `<name>_currency`), and `Money.ofMinor(minor,
currency: string)`, `Money.of(decimal, currency)`, `Money.zero(currency)`, `Money.max(...)`, `plus`, `minus`, `times`, `divide`,
  `allocate`, `equals` and `toDecimal` (template: `Money.zero(draft.currency)`, `sum.plus(...)`, `.times(quantity)`,
  `Money.max(total, zero)` in the order pricing service). The wire form is its own fields, so no `toJSON`.
- **FR-005**: `Money` SHALL refuse a minor amount or a result that is not a safe integer (ADR 0294 decision 27).
- **FR-006**: `Money.of` SHALL be a pure function of its literal arguments so gen can evaluate it in a default
  (ADR 0294 decision 26).
- **FR-007**: `Rounding` SHALL be an `Enum.of` from `@stackra/contracts` with `Down`, `Up`, `HalfUp` and `HalfEven`;
  `HalfEven` is the default of `times` and `divide` (ADR 0220 decision 3).
- **FR-008**: `money()` SHALL be a zod codec from the wire `{ minor: safe integer, currency: CurrencyCode }` to a
  `Money`; `currencyCode()` a zod enum of the codes. Both SHALL type their output exactly, so `X$Check` holds.
- **FR-009**: Dependencies SHALL be `@stackra/contracts` (`workspace:*`) and `zod` (`catalog:`) only.
- **FR-010**: Every source file SHALL carry the Stackra file contract, one exported declaration per file (ADR 0305),
  TSDoc on every export; tests SHALL sit in `__tests__/` beside the subject and import from `@stackra/testing`.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/money` exists with the shape it uses:
  `CurrencyCode` (type), `Money` (`ofMinor`, `zero`, `max`, `plus`, `times`, `divide`, `toDecimal`, `minor`,
  `currency`, type use), `Rounding`
  (`Rounding.Down`), `money()`, `currencyCode()` (with `.default("USD")`).
- **SC-002**: The registry tests exist: safe-integer refusal, `Money.of` constant evaluation, allocation and each
  rounding mode, mixed currencies refused, ISO 4217 exponents, codec decode and encode.
- **SC-003**: The barrel test fails when an export is added or removed.

## Assumptions

- `Money` lives at `src/core/values/money.value.ts`: ADR 0294 has no group for a value class, so this follows the
  `bases/` precedent of `@stackra/contracts`; the kind-path table (STA-338) settles the name.
- The model package maps `Money` as an embeddable (two columns) and builds loaded values without the constructor,
  so `Money` instances are not frozen; immutability is by `readonly` and by every operation returning a new value.
- Withdrawn codes still in circulation in stored data (`ANG`, `BGN`) stay in the table beside their successors
  (`XCG`, `EUR`) so stored amounts keep decoding; removing a code is a breaking change with its own changeset.
