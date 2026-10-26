# Feature Specification: calendar: prayer-time source

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-840

**Clarifications status**: complete

**Input**: A `PrayerTimes` port with a computed driver; the method is market-pack data.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/calendar
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0414 (Proposed)
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `PrayerTimes.on(date, place)` returns Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha as UTC instants.
- **FR-002** `ComputedPrayerTimesDriver` computes them from the sun under `PrayerMethod`.
- **FR-003** `prayerMethodFromPack` reads `calendar.prayer_times`; a missing or invalid method is refused.

## Not built here

- Pack values for any market (owner data).
- A published-timetable driver.
