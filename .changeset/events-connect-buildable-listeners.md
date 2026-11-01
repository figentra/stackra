---
"@stackra/container": patch
"@stackra/events": patch
---

The events testing plugin connects only the listeners a testing app can build: one whose dependency nothing binds (a
listener of a module the test did not boot, such as one needing `QueueService`) is skipped, and any other error
building a listener still throws. The container throws a typed `UnboundTokenError` for a class nothing binds; its
message is unchanged.
