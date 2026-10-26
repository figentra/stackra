---
"@stackra/calendar": minor
---

Support every RFC 5545 date and time part of RRULE (BYSETPOS, BYYEARDAY, BYWEEKNO, BYHOUR, BYMINUTE, BYSECOND, YEARLY
BYDAY positions and UNTIL with a time) and refuse the rest with a reason (ADR 0387); add `CountMode` so COUNT can count
only kept dates; add the `nth_weekday` holiday kind and the `observe` shift; read the calendar and the leap-birthday
rule from market packs with `calendarFromPack` and `leapBirthdayFromPack`.
