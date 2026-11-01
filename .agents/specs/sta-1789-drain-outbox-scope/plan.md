# Implementation Plan: drainOutbox delivers like the inbox

**Spec**: `spec.md` · **Linear**: STA-1789 · **Branch**: `figentra/sta-1789-drain-outbox-scope` (on the 0.2.2 stack,
which carries STA-1740's `commitEvents`)

This Mac runs only oxfmt and oxlint; tests run on a box through stackra-8a.

| Step | What                                                                                                    | Gate           |
| ---- | ------------------------------------------------------------------------------------------------------- | -------------- |
| 1    | events testing: `DeliveryScope`, `deliverEventsIn`, harness `app` and `scopes`, `commitEvents(…, call)` | events tests   |
| 2    | `drainOutbox` delivers one event at a time through the delivery scope                                   | events tests   |
| 3    | database testing: register the inbox-shaped delivery scope; the subscriber passes the running call      | database tests |
| 4    | billing#2 and #4 without their wrappers                                                                 | stackra-8a     |
