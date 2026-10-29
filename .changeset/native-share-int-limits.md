---
"@stackra/native-share": patch
---

`NativeShareOptions.maxItems`, `maxBytes` and `maxTextLength` carry `@Int` with the shipped schema's bounds, so gen
reads them as whole numbers (STA-1542).
