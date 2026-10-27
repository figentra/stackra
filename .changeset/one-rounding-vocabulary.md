---
"@stackra/contracts": minor
"@stackra/money": minor
"@stackra/pricing": patch
"@stackra/i18n": patch
"@stackra/support": patch
---

One rounding vocabulary (STA-1383). Breaking: `Rounding` moves from `@stackra/money` to `@stackra/contracts` (same
four codes, same order); import it from `@stackra/contracts`. `@stackra/support`'s `QuantityRounding` stays a
dependency-free union and is documented, and type-tested in money, as the `down`, `up` and `half_up` subset of it.
