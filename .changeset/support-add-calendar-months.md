---
"@stackra/support": minor
---

<!-- Purpose: release note for addCalendarMonths. Boundary: changelog text only. Runtime: none. Governing contract: STA-1725; ADR 0366. -->

Add `addCalendarMonths(instant, months, timeZone, anchorDay?)`: whole calendar months on the wall clock of an IANA time
zone, the day clamped to the month's end (31 Jan, 28 or 29 Feb, 31 Mar) and `anchorDay` keeping the original day across
a chain. A time skipped by a spring-forward change moves to the first valid instant; an ambiguous fall-back time takes
the earlier offset. It needs no dependency (`Intl.DateTimeFormat`).
