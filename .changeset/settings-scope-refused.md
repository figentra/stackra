---
"@stackra/settings": patch
---

`SettingsResolver#write` and `SettingsReader#write` refuse a key whose `scopes` leave out the level written (the page's, or `user` for a user's own layer) with `setting_scope_refused` (`SettingScopeRefusedError`), before anything is written; break-glass does not lift it. The level comes from the page and the target alone, so no new binding is needed and reads are unchanged.
