---
"@stackra/gen": patch
---

Gen recognises a package's migration macros whichever peer-variant copy of `@stackra/database` they extend: a macro is a
class whose chain reaches the `Macro` kind base and that implements `apply`, no longer `instanceof` the member's own
copy, which silently dropped them (`t.belongsToTenant is not a function`). A migration that calls a blueprint method no
macro supplied now names the macros gen collected in its `migration_compile_failed` message (STA-2006).
