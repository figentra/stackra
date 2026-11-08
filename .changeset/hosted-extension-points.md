---
"@stackra/gen": patch
"@stackra/loyalty-kit": patch
---

A published package's manifest lists its extension points in `services`, beside the services that inject them, so a
host's wiring binds them. Commerce customers injects `AccountService` from `@stackra/loyalty-kit`, whose
`LoyaltyKitExtensionPoint` had no binding and failed with `UnboundTokenError`.
