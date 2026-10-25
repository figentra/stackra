# Feature Specification: `@stackra/calendar`, calendar mechanism over market-pack data

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: The `@stackra/calendar` row of `notes/handover/stackra-package-needs.md` (approved by owner questionnaire
#18, not on disk): Hijri (Umm al-Qura) and Gregorian side by side, time zones, business days, holiday sets, court
working weeks, an "uncertain" result for unannounced Hijri holidays, working hours, RRULE recurrence that skips
holidays, slot finding over free and busy time with duration segments (processing gaps), age on a date. Holiday sets
and working weeks are data from market packs (config-model.md, ADR 0363).

## Impact

- **Apps touched**: none
- **Services touched**: none (OS scheduling-calendar, geography and workforce, and the products consume it later)
- **Packages touched**: `packages/foundation/calendar` (new)
- **Cross-service events**: none
- **Tenancy and data**: none; calendar data is passed in (market pack plus tenant settings), never stored here
- **Secrets**: none
- **ADR needed**: yes, ADR 0366 (Proposed): the package, its category and the data model of calendar packs
- **New dependencies**: none; `zod` from the default catalog, `@stackra/contracts` through `workspace:*`. Time zones
  and Umm al-Qura come from `Intl` (ICU), so no `rrule`, `luxon` or Hijri library is added
- **Deploy modes**: same in all; isomorphic and offline
- **Licence tier**: free (MIT)
- **Docs to update**: the package README and AGENTS; ADR 0366
- **Lane**: full (a new package)
- **Change risk**: R2 (legal deadlines and delivery promises depend on it; no money, auth or tenant data)

## Clarifications

### Session 2026-10-25

- Category: `foundation`. The package is pure date mechanism with no persistence, shared by the till and the server;
  `data` holds persistence packages (model, database, storage).
- No port: the market-pack loader has no home yet (ADR 0363 open question 1), so functions take `BusinessCalendar`
  data and a schema (`BusinessCalendar$`) checks it at the boundary.
- How an uncertain day counts (`uncertainDays`) and the 29 February birthday rule (`LeapBirthday`) are data, not
  package defaults.
- Recommended options of the "Conflicts to settle" section do not touch this row.

## User Scenarios & Testing

### User Story 1 - Business days and deadlines without a silent guess (Priority: P1)

A deadline engine or a delivery promise adds N business days under a market's working week and holidays, and is told
when a moon-sighted holiday may move the answer.

**Acceptance Scenarios**:

1. **Given** a Sunday-to-Thursday week and a dated closure on Monday, **When** one business day is added to Sunday,
   **Then** the result is Tuesday with no uncertain days.
2. **Given** a sighted Hijri holiday that nobody confirmed, **When** a count crosses it, **Then** the day is listed in
   `uncertain` and counts as the calendar's `uncertainDays` says.
3. **Given** a dated rule with the same key in the same Hijri year, **When** the status of a day is read, **Then** the
   dated rule replaces the computed occurrence.

### User Story 2 - Hijri and Gregorian side by side (Priority: P1)

A screen shows a stored date in both calendars, and a Hijri rule becomes a stored date.

**Acceptance Scenarios**:

1. **Given** `2025-03-01`, **When** `hijriOf` runs, **Then** it returns 1 Ramadan 1446.
2. **Given** 30 Ramadan 1446 (a 29-day month), **When** `gregorianOf` runs, **Then** it throws a `RangeError`.

### User Story 3 - Working hours, recurrence and slots (Priority: P1)

A booking engine reads open hours in the branch's zone, expands a recurring series that skips holidays, and finds
start times for a service with a processing gap.

**Acceptance Scenarios**:

1. **Given** hours 20:00 to 02:00, **When** open intervals are read, **Then** the span runs into the next day.
2. **Given** a weekly 09:00 series across a clock change, **When** it is expanded, **Then** each start stays 09:00 local.
3. **Given** a busy block during a booking's processing gap, **When** slots are searched, **Then** the start is offered.

### User Story 4 - Age on a date (Priority: P2)

An academy checks an age-group cut-off; the 29 February rule comes from the market pack.

## Requirements

- **FR-001**: `package.json` names `@stackra/calendar` at `packages/foundation/calendar`, `exports` lists only `.`,
  `turbo.jsonc` carries `tier:lib`, dependencies are `@stackra/contracts` (`workspace:*`) and `zod` (`catalog:`).
- **FR-002**: `.` exports exactly `BusinessCalendar$`, `DayStatus`, `HolidayKind`, `LeapBirthday`, `UncertainDays`,
  `addBusinessDays`, `addWorkingMinutes`, `ageOn`, `dayStatus`, `findSlots`, `gregorianOf`, `hijriOf`, `instantOf`,
  `localDateOf`, `occurrences`, `openIntervals` and the types `BusinessCalendar`, `BusinessDayResult`, `HijriDate`,
  `HolidayRule`, `Interval`, `IsoDate`, `Occurrence`, `RecurrenceOptions`, `Segment`, `SlotQuery`.
- **FR-003**: Hijri conversion uses `islamic-umalqura` and throws when the runtime lacks it.
- **FR-004**: Time zones are IANA names resolved by the runtime; local wall times survive clock changes.
- **FR-005**: Holiday sets are `dated`, yearly `gregorian` and yearly `hijri` rules with `since`/`until`; a dated rule
  with the same key replaces a yearly occurrence in its year.
- **FR-006**: A sighted Hijri occurrence without a confirming dated rule gives `uncertain`; business-day results list
  every uncertain day crossed.
- **FR-007**: Working weeks list weekdays with hours (court working weeks are the same data); night hours cross midnight.
- **FR-008**: RRULE supports FREQ, INTERVAL, COUNT, UNTIL, BYDAY (with month positions), BYMONTHDAY, BYMONTH and WKST,
  refuses the rest, and skips holidays of a given calendar.
- **FR-009**: Slot finding treats segments with `occupies: false` as processing gaps.
- **FR-010**: `ageOn` takes the leap-birthday rule as a parameter.
- **FR-011**: No calendar value (country, weekend, holiday, offset) is written in source; tests use made-up fixtures.
- **FR-012**: Every source file opens with the Stackra file contract and has one exported declaration with TSDoc;
  every test sits in `__tests__/` and imports `@stackra/testing`.

## Success Criteria

- **SC-001**: The package, its spec, its changeset and ADR 0366 exist.
- **SC-002**: Every public symbol has a test beside it (run later in the testing workflow; owner mode).
