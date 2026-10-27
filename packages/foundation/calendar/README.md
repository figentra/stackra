# @stackra/calendar

Calendar mechanism for every product: Umm al-Qura and Gregorian dates side by side, time zones, business days over
holiday sets and working weeks, working hours, RRULE recurrence that skips holidays, slot finding with processing gaps,
and age on a date. It holds no calendar data: working weeks, holidays, Hijri rules and court calendars come from
market packs, read through `@stackra/market-packs`, and tenant settings (ADR 0363, ADR 0366, ADR 0387).

**Tier:** `tier:lib` (`packages/foundation/calendar`), entries `.` and `./contracts`. Depends on `@stackra/contracts`,
`@stackra/market-packs` and `zod`;
isomorphic and offline, so the same code runs on a server, a browser and a till. It reads the runtime's ICU data
(`Intl`) for time zones and the `islamic-umalqura` calendar, and no clock, locale, environment or network.

## Entry points

| Import                        | Holds                                  | Exports                                                                   |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| `@stackra/calendar`           | `src/core/`: isomorphic code           | the symbols in the table below                                            |
| `@stackra/calendar/contracts` | `src/contracts/`: leaf enums and types | `DayCountMode`, `BusinessDayBoundary`, `HijriSchedule`, `PackCalendarRef` |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` and `src/contracts/index.ts` are stand-in barrels.

## What is here

| Symbol                                                  | Use                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `BusinessCalendar$`, `BusinessCalendar`                 | the schema and type of calendar data: `timeZone`, `workingWeek`, `holidays`, `uncertainDays`   |
| `HolidayRule`, `HolidayKind`                            | a holiday entry: `dated` span, yearly `gregorian` date, yearly `nth_weekday` or `hijri` date   |
| `calendarFromPack`, `PackCalendarOptions`               | the `BusinessCalendar` a resolved market pack gives on a date, with local data laid over it    |
| `leapBirthdayFromPack`                                  | the pack's 29 February rule on a date, for `ageOn`                                             |
| `hijriOf`, `gregorianOf`, `HijriDate`                   | Umm al-Qura to and from the stored ISO date                                                    |
| `instantOf`, `localDateOf`                              | a local date and time in a zone to an instant, and an instant to its local business day        |
| `dayStatus`, `DayStatus`                                | `working`, `rest_day`, `holiday` or `uncertain` for one date                                   |
| `addBusinessDays`, `BusinessDayResult`                  | N business days on, with every uncertain day crossed                                           |
| `openIntervals`, `addWorkingMinutes`                    | working hours between two instants; an instant N working minutes on (SLAs, deadlines in hours) |
| `occurrences`, `RecurrenceOptions`, `Occurrence`        | RRULE expansion in a time zone, skipping holidays and flagging uncertain dates                 |
| `icalFeed`, `IcalFeed`, `IcalEvent`, `IcalStatus`       | an RFC 5545 published feed (VCALENDAR of VEVENTs) in UTC, TEXT-escaped and folded at 75 octets |
| `CountMode`                                             | what COUNT counts: every generated date (RFC 5545, the default) or only kept dates             |
| `findSlots`, `SlotQuery`, `Segment`, `Interval`         | start times a booking fits, with processing gaps that free the resource                        |
| `ageOn`, `LeapBirthday`                                 | age in whole years on a date; the 29 February rule comes from the pack                         |
| `UncertainDays`, `IsoDate`                              | how an uncertain day counts (calendar data); the `YYYY-MM-DD` date form                        |
| `IsoDate$`, `HijriDate$`, `WorkingWeek$`, `WorkingWeek` | the shipped schemas a shape field typed `IsoDate`, `HijriDate` or `WorkingWeek` compiles to    |

## Calendar data

```ts
import { addBusinessDays, calendarFromPack } from "@stackra/calendar";

// From the resolved market pack (the location's, through MarketContext.packFor), with the location's own data.
const calendar = calendarFromPack(context.packFor(record, "calendar"), today, {
  timeZone: location.timeZone,
  holidays: tenantClosures,
});
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
- Pack keys: `calendar.time_zone`, `calendar.working_week`, `calendar.uncertain_days`, `calendar.leap_birthday` and any
  number of holiday sets `calendar.holidays.<set>` (each a list of rules), joined across overlays, so the `us` federal
  set and a state's set both apply. A missing required key is refused, never defaulted.
- An `nth_weekday` rule is the n-th (or, negative, n-th last) weekday of a month plus an `offset` in days (the day
  after the fourth Thursday of November). A yearly `gregorian` or `nth_weekday` date may carry `observe`: per weekday,
  a shift in days (a Saturday date kept on the Friday), possibly into the year before.

## RRULE

Supported: `FREQ` (DAILY, WEEKLY, MONTHLY, YEARLY), `INTERVAL`, `COUNT`, `UNTIL` (a date, or a date and time in UTC
with `Z` or in the series' wall time), `BYDAY` (with positions such as `2MO` and `-1FR` in the month, or `20MO` in the
year for YEARLY without BYMONTH), `BYMONTHDAY`, `BYMONTH`, `BYYEARDAY`, `BYWEEKNO`, `BYHOUR`, `BYMINUTE`, `BYSECOND`,
`BYSETPOS` and `WKST`. The rule is expanded period by period; BYSETPOS picks within a period; instances before the
series start are neither returned nor counted.

Refused on purpose, each with its reason in the `RangeError` (ADR 0387):

| Part                                  | Reason                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `FREQ=HOURLY`, `MINUTELY`, `SECONDLY` | a series here is dates at wall times; repetition within a day is working hours or slots |
| `RSCALE` (RFC 7529)                   | a yearly Hijri date is a holiday rule of kind `hijri`; ICU, not RRULE, converts it      |
| `SKIP` (RFC 7529)                     | only means something with `RSCALE`                                                      |
| `BYSECOND=60`                         | a leap second has no instant in ECMAScript time                                         |

Also refused, as RFC 5545 forbids them: an unknown or repeated part, COUNT with UNTIL, BYYEARDAY with DAILY, WEEKLY or
MONTHLY, BYWEEKNO outside YEARLY, BYMONTHDAY with WEEKLY, a BYDAY position with DAILY, WEEKLY or BYWEEKNO, and BYSETPOS
with no other BY part.

Excepted and holiday dates count toward `COUNT`, as `EXDATE` does, unless `countMode` is `kept`: then only the dates
kept count, so "ten sessions" stays ten when a holiday falls on one. Which mode a product uses is its own setting.

## iCalendar feed

`icalFeed` writes the text of a read-only subscribed calendar (`METHOD:PUBLISH`): one `VEVENT` per event with `UID`,
`DTSTAMP`, `DTSTART`/`DTEND` in UTC, `SUMMARY` and an optional `STATUS`, CRLF line ends, lines folded at 75 octets
without splitting a character. It is pure: the caller passes the stamp instant, the `PRODID` and every `UID` (product
settings, never this package), and chooses a summary free of personal data. Refused with a `RangeError`: an instant
without an offset, an end not after its start, a line break in `PRODID` or a `UID`. Not written: `RRULE`, `VALARM`,
`VTIMEZONE`, attendees, location or description; add one only when a consumer needs it.

## Limits

- The Umm al-Qura table in ICU covers 1300 to 1600 AH. A runtime without full ICU throws instead of guessing.
- A wall time skipped by a clock change resolves to an instant beside the gap.
- BYWEEKNO is matched inside the calendar year of each YEARLY period, so the days of week 1 that fall in late December
  belong to the year before.
- **Hermes on the till (note, not checked in code).** Hijri and time zones need the runtime's full ICU. Not yet
  confirmed on the till build: on a release build of the React Native app, check that
  `new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: "Asia/Riyadh" }).resolvedOptions().calendar` is
  `islamic-umalqura` and that `hijriOf("2026-03-20")` answers. If either fails, the till needs a JSC or ICU-enabled
  Hermes build; the package will not fall back.

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
