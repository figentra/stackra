---
"@stackra/container": minor
---

Add the multi-binding: `container.getAll(Base)` and `DiscoveryService.getAll(Base)` return every class the booted
modules bind or export that extends `Base`, in wiring order, so a module contributes to another module's extension
point (a guard to a checkout gate) by binding a subclass. No new token type and no new wiring section (ADR 0457).
