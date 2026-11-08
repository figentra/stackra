---
"@stackra/events": patch
---

The events testing plugin offers `OutboxFake` as `EventOutbox`'s `memory` test driver. Since gen binds the real outbox
for the action pipeline (#706), a `createTestingModule(...).useDrivers("memory")` app bound `OutboxEventOutboxDriver`,
so `drainOutbox()` threw and `toRecord` and `app.events.published()` saw nothing. Under `memory` the fake is bound
again. An explicit `.override(EventOutbox, …)` still wins, and a container that doesn't pick `memory` keeps the real
outbox, as production wiring does.
