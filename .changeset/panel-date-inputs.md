---
"@stackra/panel": minor
---

Resource forms and the action input modal draw date inputs: a calendar day (`z.iso.date()`) as a date picker held as
`YYYY-MM-DD` with no time zone, and an instant (`Date`, `isoDateTime()`, `z.iso.datetime()`) as a day, an hour and a
minute in the viewer's own time zone (named under the field) held as a UTC ISO 8601 string.
