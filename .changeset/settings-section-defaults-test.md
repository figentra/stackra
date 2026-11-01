---
"@stackra/settings": patch
---

`SettingsReader#get` is covered for a section nothing stored (every default), a partial stored section (stored values
kept, the rest defaulted) and a wrong-typed stored value (still refused), over the schema gen now emits.
