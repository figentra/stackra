---
"@stackra/infra-identity": minor
---

`identityStack` sets the instance's `DefaultLockoutPolicy`: an account locks after five failed password checks
(STA-1580). The pinned `@pulumiverse/zitadel` 0.2.0 has no `maxOtpAttempts`, so OTP attempts keep ZITADEL's default
until the provider is upgraded.
