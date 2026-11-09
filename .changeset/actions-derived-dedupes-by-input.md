---
"@stackra/actions": patch
---

A `Derived` action keeps deduplicating by its input for every caller but an API key, even when a key is sent: a generated client mints a fresh key per call, so a double click stays one effect.
