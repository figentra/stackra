---
"@stackra/state": minor
---

Add `@stackra/state`, client state of the programming model v3.1: the `Store` kind base in both forms
(`extends Store` for session-only state, `extends Store({ persist })` for state persisted into a client storage area),
whose fields are the state and whose protected `set` is the only writer; persistence under the derived key the
generated wiring registers through `registerStores`, with hydration that never overwrites a newer write; the
structural `StoreStorage` contract `@stackra/storage` satisfies; `StateConfig` (key `state`) with its shipped schema
`StateConfig$`; `signal`, `useSignal` and `useStore` in `./react`; and `createStore` and `mountStore` in `./testing`.
