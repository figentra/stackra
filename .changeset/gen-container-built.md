---
"@stackra/gen": patch
---

A host's wiring no longer binds `DiscoveryService` (or `Container`), which the container builds itself: a service that
injects it only lists it among the `platform` classes. The binding gen wrote had `deps: [Container]`, whose constructor
is private, so the host's build failed with TS2322 (commerce stock).
