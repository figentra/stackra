# Feature Specification: `@stackra/support` wave 1a, the `time` helpers

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (owner, 2026-10-24: build only what a consumer imports today)

**Input**: Build `@stackra/support` (foundation, wave 1a) for real. Sub-wave 1a builds only `time`
(`subMinutes` and its friends); `str`, `arr`, `async` and `object` are added when a consumer needs them. This
supersedes the port-everything scope of `sta-75-support`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service consumes `time` once converted, STA-344)
- **Packages touched**: `packages/foundation/support` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (pure functions)
- **Secrets**: none
- **ADR needed**: no (ADR 0127 2026-10-24 note places support in foundation with entry `.`)
- **New dependencies**: none at runtime; dev dependencies from existing catalogs and `workspace:*`
- **Deploy modes**: same in all; no outbound call, no environment, clock, locale or time zone read
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract; no auth, tenancy, secrets or HTTP)

## User Scenarios & Testing

### User Story 1 - Compute a cutoff without hand arithmetic (Priority: P1)

An action author computes "30 minutes before now" from the pipeline clock with `time.subMinutes(ctx.now(), n)`
and gets a new `Date`, exactly as the template's `ExpireUnpaidOrdersAction` does.

**Independent Test**: `src/core/constants/__tests__/time.constant.test.ts`.

**Acceptance Scenarios**:

1. **Given** `ctx.now()` is `2026-10-24T00:10:00Z`, **When** `time.subMinutes(now, 30)` runs, **Then** it returns
   `2026-10-23T23:40:00Z` and `now` is unchanged.
2. **Given** an invalid `Date` or an amount of `NaN` or `Infinity`, **When** any helper runs, **Then** it throws a
   `RangeError`.

### Edge Cases

- A daylight-saving change in a local zone: a day stays exactly 86,400 s (UTC timeline).
- Leap day, month end and year end: handled by the UTC timeline.
- Negative amount: shifts the other way. Fractional amount: allowed, truncated to whole milliseconds.
- Calendar months and years: not offered (need a time zone and a clamping rule; no consumer).

## Requirements

- **FR-001**: The package SHALL be `@stackra/support` at `packages/foundation/support`, `tier:lib`, with the one
  entry `.` (registry row; ADR 0127 2026-10-24 note; ADR 0294 decision 15).
- **FR-002**: `.` SHALL export `time`, an object whose members `addSeconds`, `subSeconds`, `addMinutes`,
  `subMinutes`, `addHours`, `subHours`, `addDays` and `subDays` each take `(date: Date, amount: number)` and return a
  new `Date` (template contract: `time.subMinutes(date, n)`).
- **FR-003**: Each helper SHALL NOT mutate its input, read the clock, the host time zone or the locale.
- **FR-004**: Each helper SHALL throw a `RangeError` for an invalid `Date` or a non-finite amount.
- **FR-005**: The package SHALL have zero `dependencies`, zero `peerDependencies` and no workspace import at runtime;
  versions only through `catalog:` or `workspace:*`.
- **FR-006**: Every source file SHALL carry the Stackra file contract, one declaration per file (ADR 0305), and every
  export TSDoc; tests SHALL sit in `__tests__/` beside the subject and import from `@stackra/testing` (ADR 0022,
  ADR 0269).

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/support` (`time`, used as `time.subMinutes`) exists
  with that shape.
- **SC-002**: The `time` test file covers every member in both directions and the edges above (run in the separate
  testing workflow).
- **SC-003**: The package lists 0 `dependencies` and 0 `peerDependencies`.

## Assumptions

- `Clock` lives in `@stackra/contracts`, not here (registry row of contracts); support takes the time as an argument.
- The callers' `ctx.now()` returns a `Date`.
