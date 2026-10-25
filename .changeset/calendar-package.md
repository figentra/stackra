---
"@stackra/calendar": minor
---

Add `@stackra/calendar`, calendar mechanism over market-pack data: `hijriOf` and `gregorianOf` (Umm al-Qura through
`Intl`), `instantOf` and `localDateOf` for time zones, `dayStatus` and `addBusinessDays` over the `BusinessCalendar`
data a pack supplies (working week with hours, dated, yearly Gregorian and yearly Hijri holiday rules), with
`uncertain` days for sighted Hijri holidays nobody has confirmed, `openIntervals` and `addWorkingMinutes` for working
hours, `occurrences` for RRULE series that skip holidays, `findSlots` for bookings with processing gaps, and `ageOn`.
`BusinessCalendar$` checks calendar data at the boundary. The package holds no calendar values of its own.
