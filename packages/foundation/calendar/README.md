# @stackra/calendar

Calendar mechanism for every product: Umm al-Qura and Gregorian dates side by side, time zones, business days over
holiday sets and working weeks, working hours, RRULE recurrence that skips holidays, slot finding with processing gaps,
and age on a date. It holds no calendar data: working weeks, holidays, Hijri rules and court calendars come from
market packs and tenant settings (ADR 0363, ADR 0366).

**Tier:** `tier:lib` (`packages/foundation/calendar`), entry `.` only. Depends on `@stackra/contracts` and `zod`;
isomorphic and offline, so the same code runs on a server, a browser and a till. It reads the runtime's ICU data
(`Intl`) for time zones and the `islamic-umalqura` calendar, and no clock, locale, environment or network.

## Entry points

| Import              | Holds                        | Exports                        |
| ------------------- | ---------------------------- | ------------------------------ |
| `@stackra/calendar` | `src/core/`: isomorphic code | the symbols in the table below |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` is a stand-in barrel.

## What is here

| Symbol                                           | Use                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `BusinessCalendar$`, `BusinessCalendar`          | the schema and type of calendar data: `timeZone`, `workingWeek`, `holidays`, `uncertainDays`   |
| `HolidayRule`, `HolidayKind`                     | a holiday entry: `dated` span, yearly `gregorian` date or yearly `hijri` date (with `sighted`) |
| `hijriOf`, `gregorianOf`, `HijriDate`            | Umm al-Qura to and from the stored ISO date                                                    |
| `instantOf`, `localDateOf`                       | a local date and time in a zone to an instant, and an instant to its local business day        |
| `dayStatus`, `DayStatus`                         | `working`, `rest_day`, `holiday` or `uncertain` for one date                                   |
| `addBusinessDays`, `BusinessDayResult`           | N business days on, with every uncertain day crossed                                           |
| `openIntervals`, `addWorkingMinutes`             | working hours between two instants; an instant N working minutes on (SLAs, deadlines in hours) |
| `occurrences`, `RecurrenceOptions`, `Occurrence` | RRULE expansion in a time zone, skipping holidays and flagging uncertain dates                 |
| `findSlots`, `SlotQuery`, `Segment`, `Interval`  | start times a booking fits, with processing gaps that free the resource                        |
| `ageOn`, `LeapBirthday`                          | age in whole years on a date; the 29 February rule comes from the pack                         |
| `UncertainDays`, `IsoDate`                       | how an uncertain day counts (calendar data); the `YYYY-MM-DD` date form                        |

## Calendar data

```ts
import { BusinessCalendar$, addBusinessDays } from "@stackra/calendar";

// From the market pack's calendar section, merged with tenant closures by the caller.
const calendar = BusinessCalendar$.parse(pack.calendar);
const due = addBusinessDays(calendar, "2026-03-15", 5);
if (due.uncertain.length > 0) {
  // a sighted holiday may move the date: warn, never guess
}
```

- Dates are stored as Gregorian `YYYY-MM-DD`; Hijri is computed. Display formatting is `@stackra/i18n`'s.
- A `hijri` rule with `sighted: true` makes its days `uncertain` until a `dated` rule with the same `key` appears for
  that Hijri year. A `dated` rule with the same key also moves a yearly holiday in its year.
- Hours whose end is not after their start run past midnight. Each weekday is listed once; an unlisted day is a rest
  day.
- `uncertainDays` (`working` or `closed`) is data too: the package never decides how a doubt counts.

## RRULE

`FREQ` (DAILY, WEEKLY, MONTHLY, YEARLY), `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY` (with positions such as `2MO` and `-1FR`
inside a month), `BYMONTHDAY`, `BYMONTH` and `WKST`. Any other part throws a `RangeError`. Excepted and holiday dates
still count toward `COUNT`, as `EXDATE` does.

## Limits

- The Umm al-Qura table in ICU covers 1300 to 1600 AH. A runtime without full ICU throws instead of guessing.
- A wall time skipped by a clock change resolves to an instant beside the gap.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/calendar`.
