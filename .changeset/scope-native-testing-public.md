---
"@stackra/scope": minor
---

Gate A: the package is now public (no `private` flag). Add the `./native` entry with `rememberActiveScope` (a device
restores its last scope from the `prefs` storage area and keeps it) and the `./testing` entry with `scopeRefOf` and
`fakeScopeTree`.
