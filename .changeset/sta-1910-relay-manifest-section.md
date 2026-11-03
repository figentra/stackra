---
"@stackra/contracts": minor
---

`StackraManifest` gains an optional `relay` section: a producer's public keys and the consumers it delivers to, per
environment (ADR 0511, amendment of 2026-11-02, STA-1910). Gen writes it for a service that delivers events to another
app; a consumer's inbox verifies deliveries with those keys.
