---
"@stackra/runway": minor
"@stackra/cli": minor
---

Add mobile onboarding (STA-1623, ADR 0482). `@stackra/runway`: `onboardMobile` runs thirteen idempotent steps that take
a product's mobile app from nothing to store-ready (store ids from the product key, EAS project, Apple bundle id and
capabilities, Google Cloud project, Firebase apps and config files, Analytics link, Sentry project, EAS-managed signing,
the FCM v1 key written blind to Infisical and handed to EAS, store key names, the Play app and its manual first upload),
behind the new `AppleDeveloper`, `PlayConsole`, `ExpoProjects`, `GoogleCloud`, `Firebase`, `SentryProjects` and
`VaultWriter` ports with real and memory drivers; `mobileIdsOf`, `easJsonOf`, `toolVersionOf`; the root runway's
`mobile.<app>` gains `eas.owner`, `google` and `sentry`. The mobile job writes `eas.json` with the exact toolchain pins
and copies the Firebase config files; `EasProviderDriver` gains `submit` and `platformOf`; `deployProduct` gains
`mobileOnly` and holds an Android build back while Play has no release. `@stackra/cli`: `stackra mobile onboard
[--app] [--check|--live]` and `stackra deploy --product --mobile-only`.
