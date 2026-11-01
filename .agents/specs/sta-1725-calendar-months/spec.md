# Feature Specification: calendar months in a time zone

**Feature Branch**: `figentra/sta-1725-calendar-months`

**Created**: 2026-10-31

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1725

**Clarifications status**: complete

**Input**: "A pure calendar-month helper: billing subscription and membership cycles and commerce selling plans renew one calendar month later in the tenant's or Market's IANA time zone (31 Jan, 28 or 29 Feb, 31 Mar). `time.addMonths` shifts on the UTC calendar only."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/foundation/support` (`@stackra/support`) only; it already holds the `time` helpers, and `@stackra/contracts` has no date helpers, so the helper sits beside them
- **Cross-service events**: none
- **Tenancy and data**: none; a pure function, no table, no migration
- **Secrets**: none
- **ADR needed**: no; ADR 0366 (decision 5) already reads time zones from the runtime's IANA database
- **New dependencies**: none (`Intl.DateTimeFormat`)
- **Deploy modes**: all; a library function, no deploy of its own
- **Lane**: lite
- **Change risk**: R1 (a new exported function, no existing behaviour changes)
- **Licence tier**: free
- **Docs to update**: `packages/foundation/support/README.md` (the `time` section and the export row)

## Status history

- 2026-10-31 → Clarified: lead-approved helper requested by the leader

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Renew one calendar month later in a zone (Priority: P1)

A billing cycle renews on the same wall-clock day and time each month in the tenant's zone, clamped to the month's end.

**Acceptance Scenarios**:

1. **Given** 31 Jan, **When** one month is added, **Then** it is 28 Feb (29 in a leap year).
2. **Given** an anchor day of 31, **When** 2 or 3 months are added to 31 Jan, **Then** it is 31 Mar and 30 Apr.
3. **Given** a wall time skipped by a spring-forward gap, **Then** the result is the first valid instant after it; **Given** an ambiguous fall-back time, **Then** the earlier offset is taken.
4. **Given** an unknown zone or a non-integer month count, **Then** a `RangeError` is thrown.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `addCalendarMonths(instant, months, timeZone, anchorDay?)` shall return the instant that is `months` calendar months from `instant` on the wall clock of `timeZone`, with the day `min(anchorDay ?? day, last day of the target month)` and the same wall-clock time.
- **FR-002**: It shall depend on nothing but `Intl`, and shall never read the clock.

## Success Criteria _(mandatory)_

- **SC-001**: Unit tests cover clamping, anchor, negative months, year rollover, UTC, a zone without DST, a gap, a fall-back and invalid input.
- **SC-002**: `pnpm verify` is green.

## Assumptions

- Years before 1 CE and sub-second zone offsets are out of scope.
