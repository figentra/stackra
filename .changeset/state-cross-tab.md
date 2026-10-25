---
"@stackra/state": minor
---

Sync persisted stores across the tabs of an origin: a commit posts `{ key, version, state }` on the
`BroadcastChannel` `stackra:state:<area>`, and other contexts apply it to their instance of the store (validated as
hydration is) and notify subscribers. No option; a runtime without `BroadcastChannel` (native, Node) does nothing.
