---
"@stackra/state": minor
"@stackra/coordinator": patch
---

Breaking rename (STA-1383): the `Signal<T>` type of `@stackra/state/react` is `StateSignal<T>`, so `Signal` is only
`@stackra/workflow`'s run signal kind. `signal()` and `useSignal()` keep their names.
