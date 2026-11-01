---
"@stackra/container": patch
"@stackra/skills": patch
---

The container's missing-binding error now ends with a hint to run `stackra gen` first when a test hits it (gen's setup
registers the member's wiring). The bundled rule and skills no longer say the v3 packages "do not ship yet", and the
migrations skill says to write migrations by hand until `stackra db diff` exists (STA-1808).
