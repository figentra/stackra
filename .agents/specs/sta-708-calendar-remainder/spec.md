# Feature Specification: @stackra/calendar remainder (RRULE parts, COUNT mode, pack binding, US holidays)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-708

**Clarifications status**: complete

**Input**: Finish `@stackra/calendar` (ADR 0366): every RRULE part supported or refused with a reason, UNTIL with a
time, an optional COUNT mode for kept dates, the calendar read from the market-pack loader, first pack values for
`uncertainDays` and `LeapBirthday`, US federal and state holiday sets as pack data, and a note on Hermes ICU.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/calendar; the US holiday data lives in packages/foundation/market-packs
  (`assets/data/packs/`, STA-666)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0387 (Proposed)
- **New dependencies**: workspace only (`@stackra/market-packs`); the lockfile is not updated (owner mode)
- **Deploy modes**: same everywhere; the till needs full ICU (note below)
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** BYSETPOS, BYYEARDAY, BYWEEKNO, BYHOUR, BYMINUTE, BYSECOND and YEARLY BYDAY positions in the year are
  expanded; UNTIL with a time ends the series at that instant (UTC or wall time).
- **FR-002** FREQ HOURLY, MINUTELY, SECONDLY, RSCALE, SKIP and BYSECOND=60 are refused with their reason; combinations
  RFC 5545 forbids are refused.
- **FR-003** `countMode: "kept"` counts only kept dates; the default stays RFC 5545.
- **FR-004** `calendarFromPack` and `leapBirthdayFromPack` read the calendar keys of a resolved pack.
- **FR-005** Holiday kind `nth_weekday` and the `observe` shift carry the US federal and state sets as data.

## Hermes ICU (note, not code)

Not confirmed. On a release build of the till app, check that
`new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: "Asia/Riyadh" }).resolvedOptions().calendar` is
`islamic-umalqura` and that `hijriOf("2026-03-20")` answers. If not, the till needs an ICU-enabled engine build; the
package does not fall back (ADR 0366 decision 2, ADR 0387 decision 7).

## Not built here

- First values for markets with sighted holidays (`sa`, `ae`, `eg`): owner question 2 of wave 10 is still open.
- Tests, typecheck and build are written but not run (owner mode).
