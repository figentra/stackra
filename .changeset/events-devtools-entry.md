---
"@stackra/events": minor
---

Add the dev-only `./devtools` entry: `defineEventsDevtools(kit, bus)` defines the `events.listeners` (registered
listener classes by event) and `events.deliveries` (each delivery by name, with its error message, no payload)
devtools tabs (stackra-208, ADR 0246, ADR 0461).
