# AGENTS — @stackra/calendar

Calendar mechanism over market-pack data. Member at `packages/foundation/calendar` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entry `.` only. Decision records: ADR 0366, amended by ADR 0387; prayer
times ADR 0414.

## Where code goes

| You are writing…                       | It goes in…                                 |
| -------------------------------------- | ------------------------------------------- |
| An enum                                | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| A function (public or internal helper) | `src/core/functions/<name>.function.ts`     |
| A port                                 | `src/core/ports/<name>.port.ts`             |
| A driver                               | `src/core/drivers/<name>.driver.ts`         |
| A schema or constant                   | `src/core/constants/<name>.constant.ts`     |
| A type                                 | `src/core/types/<name>.type.ts`             |
| A test                                 | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`. Helpers (day numbers, zone offsets, RRULE parsing,
  range merging, the prayer-time arithmetic `computePrayerDay`) stay internal.
- Every public type a shape field may name has its shipped schema, exported as `<Type>$` (ADR 0294 decision 26). A
  part of a type gets its own name (`WorkingWeek`), never an indexed access (STA-1284).

## This package

- **No calendar data in code.** No country, weekend, holiday, Hijri adjustment, court calendar or legal rule is
  written here; it all arrives as `BusinessCalendar` data or a parameter (`LeapBirthday`). Tests use made-up fixtures.
- Dates are `YYYY-MM-DD` Gregorian and arithmetic runs on UTC day numbers; instants are ISO 8601 with an offset.
- Never guess an unconfirmed Hijri holiday: report `uncertain` and let `uncertainDays` data decide how it counts.
- Time zones and Umm al-Qura come from `Intl` (ICU); no time-zone or Hijri library is added.
- Runtime dependencies are `@stackra/contracts`, `@stackra/market-packs` and `zod` only. Refusals are `RangeError`s.
- Calendar values come from pack keys under `calendar.` (`calendarFromPack`, `leapBirthdayFromPack`,
  `prayerMethodFromPack` for `calendar.prayer_times`); never read a market's data any other way, and never default
  a missing key. The `PrayerTimes` port's computed driver is plain arithmetic; the method is pack data,
  set with `use(method)` (the container builds the driver with no arguments, as gen wires class tokens only).
- `icalFeed` only writes; it reads no clock and holds no product identity (PRODID, UID host). Every value from a
  caller that is not TEXT-escaped is refused when it holds a line break.
- Every RRULE part is either supported or refused with its reason in the message (README table); never ignore one.
- Only add a symbol a consumer imports today (the registry row in `notes/handover/stackra-package-needs.md`).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/calendar` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data        | Where   | Handling                                                                            |
| ----------- | ------- | ----------------------------------------------------------------------------------- |
| Birth dates | `ageOn` | Read as an argument and never stored, logged or returned; only the age is returned. |
