---
"@stackra/support": minor
---

Add `signedToken` (`sign`, `verify`: purpose, expiry, key id and JSON data under HMAC-SHA-256) and `oneTimeCode`
(`issue`, `verify`: single-use numeric codes stored as a peppered HMAC with expiry and attempts, constant-time
verify), both over a `SigningKeySource` that the `KeyProvider` of `@stackra/contracts` satisfies structurally (no new
dependency). `Quantity` gains `roundTo(step, mode)` and `priceMinor(pricePerMinor, per, mode)` (whole minor units, no
float). New types `SigningKeySource`, `SignedTokenCheck`, `OneTimeCodeRecord`, `OneTimeCodeCheck`, `QuantityRounding`.
No existing export changes (STA-934).
