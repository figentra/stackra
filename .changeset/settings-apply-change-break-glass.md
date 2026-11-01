---
"@stackra/settings": patch
---

`SettingsResolver#applyChange` now takes `breakGlass` in its meta and records it on the revision (STA-1692). A
break-glass change with an empty or blank reason throws a `TypeError` before anything is written. Without the flag the
revision records `breakGlass: false`, as before.
