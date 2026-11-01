---
"@stackra/events": patch
"@stackra/database": patch
---

`drainOutbox()` delivers each event as the production inbox receives it once `@stackra/database`'s testing entry is
loaded: on its own, in a new transaction, as the actor of the call that wrote it, in that call's scope (through the
app's `CallIsolation`, or `withScope` without one), so listener tests over tenant-owned rows need no wrapper.
`commitEvents(events, call)` records the call's actor, id and scope; `deliverEventsIn` registers the delivery scope
(STA-1789).
