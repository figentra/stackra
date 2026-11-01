---
"@stackra/settings": patch
---

`SettingsFake.set` keeps an array (or date) value whole instead of flattening it into `<field>.0` paths, so an array setting reads back as the array.
