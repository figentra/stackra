# Plan: calendar months in a time zone

**Spec**: `.agents/specs/sta-1725-calendar-months/spec.md`

## Design

- `src/core/functions/add-calendar-months.function.ts` in `@stackra/support`, exported from the stand-in barrel.
- Read the wall clock of the instant with a per-zone `Intl.DateTimeFormat`, add the months on the wall calendar, clamp
  the day, then convert the wall time back to an instant by trying the zone's offset a day before and a day after.
  One valid candidate is the result; two (fall-back) take the earlier; none (spring-forward gap) bisects for the first
  instant with the new offset.

## Constitution Check

| Law                       | Result | Note                                         |
| ------------------------- | ------ | -------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | `support` imports nothing; no new dependency |
| Tenancy                   | PASS   | no tenant data                               |
| Secrets                   | PASS   | none                                         |
| Not built yet (ADR 0227)  | PASS   | no date library                              |
| Test placement (ADR 0022) | PASS   | `src/core/functions/__tests__/`              |
| Versions and catalogs     | PASS   | no catalog change                            |
