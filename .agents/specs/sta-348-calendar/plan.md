# Plan: `@stackra/calendar`

**Spec**: `.agents/specs/sta-348-calendar/spec.md`

## Design

- Dates are `YYYY-MM-DD`; arithmetic runs on UTC day numbers (`dayNumber`, `dateOfDay`, `isoWeekday`).
- Time zones: `zoneOffset` reads the offset at an instant through one cached `Intl.DateTimeFormat` per zone;
  `zonedMs` resolves a wall time (offset read twice for clock changes); `instantOf` and `localDateOf` are public.
- Hijri: `hijriAt` formats with `en-u-ca-islamic-umalqura-nu-latn` in UTC; `gregorianOf` estimates from the mean month
  and corrects until `hijriAt` agrees, refusing a day the month lacks.
- Calendar data: `BUSINESS_CALENDAR_SCHEMA` (exported as `BusinessCalendar$`), `BusinessCalendar` is its output.
- `holidayCover` decides one rule for one day (dated overrides by key and year; sighted gives uncertain); `dayStatus`
  folds the rules with the working week; `isOpen` applies `uncertainDays`.
- `openRanges` builds merged ranges of hours (`mergeRanges`); `openIntervals` and `addWorkingMinutes` use it.
- RRULE: `parseRrule` (supported parts only), `rruleMatches` (one day), `occurrences` (walks days to `to`/UNTIL/COUNT).
- `findSlots` steps from each open window and checks occupying segments only.
- `ageOn` with `LeapBirthday`.

## Constitution Check

| Law                                   | Result | Note                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib`; imports `@stackra/contracts` and `zod` only                    |
| Secrets (ADR 0173)                    | N/A    | none                                                                       |
| Security                              | N/A    | pure functions; schema checks calendar data at the boundary                |
| HTTP and events                       | N/A    | none                                                                       |
| Tenancy                               | N/A    | no tenant data stored                                                      |
| Configuration over code (ADR 0363)    | PASS   | no country, weekend, holiday or legal rule in code; policy values are data |
| Not built yet (ADR 0227)              | PASS   | no rejected technology; no new dependency                                  |
| Test placement (ADR 0022)             | PASS   | every test in `src/**/__tests__/`                                          |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                          |
| Deploy modes (ADR 0076)               | PASS   | isomorphic, offline                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts, ADR 0366 (Proposed)                        |

## Deploy modes

| Mode       | Behaviour                                       |
| ---------- | ----------------------------------------------- |
| SaaS       | a library bundled into services, apps and tills |
| On-prem    | identical                                       |
| Air-gapped | identical: needs no network                     |
