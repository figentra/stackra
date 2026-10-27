---
"@stackra/infra-mobile": minor
---

`storeAccountsOf(app, connected?)` resolves the account each store of a mobile app publishes under for the mobile job
(ADR 0439, app-shells D14): a scope's connected store-account Connection (App Store Connect API key, Google Play
service account) for its store, else the platform account in `mobile.<app>.stores`. New type `StoreConnection`; new
dependency `@stackra/integrations` (its `./contracts` `MobileStore`).
