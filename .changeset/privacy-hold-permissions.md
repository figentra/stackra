---
"@stackra/privacy": patch
---

Declare `HoldPermissions` (`privacy.hold.place` L2, `privacy.hold.release` L4, `privacy.hold.read` L1) for the legal
hold actions and query, and type `ListHoldsOutput.holds` with the `LegalHoldLine` schema, so gen compiles both.
