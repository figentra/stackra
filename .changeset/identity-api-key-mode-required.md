---
"@stackra/identity": patch
---

A mode is never assumed: `parseApiKey` answers no mode for a key without a mode segment, and the verifier refuses a
key whose text or record has no mode, so live comes only from a key issued live.
