---
"@stackra/actions": patch
---

Type `AnalyticsTracked.properties` as `Record<string, Json>`, so gen compiles the event's shape (`unknown` is not a
shape type).
