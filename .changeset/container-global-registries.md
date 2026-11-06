---
"@stackra/container": patch
---

The kind registry and the permission registry live on `globalThis` under `Symbol.for` keys, so two installed copies of
`@stackra/container` (a React peer variant, or a second version) share them. A member that pins React for React Native
got a second container copy beside `@stackra/console`'s, and `stackra gen` crashed with "`@str` may mark … AddCommand
is of no kind".
