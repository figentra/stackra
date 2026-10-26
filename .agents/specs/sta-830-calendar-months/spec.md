# Feature Specification: support: calendar-month arithmetic in time

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-830

**Clarifications status**: complete

**Input**: `time.addMonths` and `time.subMonths` with end-of-month clamping.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/support
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** Months move the UTC calendar date, keep the time of day and clamp the day to the target month's end.
- **FR-002** Fractional or infinite amounts and invalid dates are refused.

## Not built here

- Zone-aware months: callers pass the wall-clock date as UTC midnight.
