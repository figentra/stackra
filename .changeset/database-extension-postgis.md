---
"@stackra/database": minor
---

Add `Extension.Postgis` (`postgis`), approved by ADR 0314, so `schema.createExtension(Extension.Postgis)` compiles, and
fix the enum header that still said PostGIS needed an ADR.
