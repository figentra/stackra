---
"@stackra/consent": minor
---

Add `@stackra/consent`, visitor consent per ADR 0298: decline by default, Global Privacy Control refuses, and the
decision stored with the policy version it answered. `.` ships the `ConsentConfig` configuration (`consent`:
`categories`, `cookieName`, `expiryDays`, `policyVersion`, `regionDefaults`, `askOnFirstLaunch`) with its shipped schema
`ConsentConfig$` and shape `ConsentOptions`; the `ConsentCategory`, `ConsentStatus` and `ConsentRegime` enums; the
`ConsentLedger` service (`status`, `isGranted`, `isRequired`, `set`, `reset`, `setRegion`, `subscribe`, `revision`);
and the `CookieConsentStoreDriver`, `StorageConsentStoreDriver` and `MemoryConsentStoreDriver` drivers. `./contracts`
ships the `ConsentStore` port and the `ConsentRecord` type, `./react` the `useConsent` hook (one category for a banner,
every category for a settings page; no decision state in a server render), and `./testing` the `fakeConsent` helper.
