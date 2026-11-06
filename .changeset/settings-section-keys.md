---
"@stackra/gen": patch
"@stackra/settings": patch
---

`#stackra/settings` keys a section's field `<section>.<name>`, so two sections of one module may share a field name
without a duplicate key (TS1117). `settingKeys` strips the section back off: each key keeps its `name` and its
`<module>.<section>.<name>` path, and files written by an older gen still work.
