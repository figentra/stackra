---
"@stackra/identity": patch
---

`verifyZitadelSignature` is exported from `@stackra/identity`, beside `claimsActionResponse`. A service that answers the
claims action (`IdpAdmin.installClaimsAction`) checks the `ZITADEL-Signature` header over the raw body with it before it
reads the body, without copying the HMAC check.
