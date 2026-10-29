---
"@stackra/native-customer-display": minor
"@stackra/peripherals": minor
"@stackra/repo-checks": patch
---

New `@stackra/native-customer-display` (ADR 0478): the `StackraCustomerDisplay` Expo module (an Android `Presentation`
and an iPad external-display scene, moved unchanged from the mobile app's `src/native-sources/customer-display/`) with
`ExternalCustomerDisplayDriver` behind the unchanged `CustomerDisplay` port, and its config plugin. `@stackra/peripherals`:
`ExternalCustomerDisplayDriver` leaves the `.` entry for the new package (same driver name `external`); import it from
`@stackra/native-customer-display`. `@stackra/repo-checks`: `checkNativeModules` no longer exempts the mobile app's
customer display (STA-1533).
