# Plan: `@stackra/support` wave 1a

**Spec**: `.agents/specs/sta-348-support/spec.md`

## Design

- One file, `src/core/constants/time.constant.ts`, exports one declaration: the frozen `time` object. Its members
  share one private `shift(date, amount, unitMs)` that validates and returns `new Date(start + amount × unitMs)`.
- Units are fixed millisecond lengths. A `Date` is a UTC instant, so adding whole days moves the UTC calendar date
  and is immune to local daylight-saving changes.
- `.` points at that file through the `@stackra/source` condition and the tsdown `index` entry until gen writes the
  entry barrel (STA-339).
- Tool configs (`tsdown.config.ts`, `vitest.config.ts`) follow the scaffold template until gen writes them.

## Constitution check

- Boundaries: no workspace runtime import; dev-only `@stackra/testing` and tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: `time` is camelCase because it is the namespace the template calls, documented in its TSDoc.

## Properties

- **P-001**: For every member and every finite amount, the result differs from the input by `amount × unit`
  milliseconds (truncated), and the input is unchanged.
- **P-002**: `subX(d, n)` equals `addX(d, -n)`.
