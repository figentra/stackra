---
"@stackra/native-spotlight": minor
---

Add `@stackra/native-spotlight` (STA-1540, ADR 0478): the signed-in person's own recent records in the phone's own
search, iOS Core Spotlight and Android launcher search, with deep links back into the app. The `DeviceSearchIndex`
port, the `SpotlightConfig` visibility rules (own records, listed kinds, never sensitive, newest and recent only),
`SpotlightIndexer` (`sync`, `remove`, `clearOnSignOut`, which clears on sign-out and on a revoked session), the memory
driver, `ExpoDeviceSearchIndexDriver` over the `StackraSpotlight` Expo module, and its config plugin.
