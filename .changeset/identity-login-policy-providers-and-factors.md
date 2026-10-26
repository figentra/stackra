---
"@stackra/identity": minor
"@stackra/infra-identity": patch
---

`LoginPolicy` gains optional `externalProviderIds` and `secondFactors` (new `IdpSecondFactor` enum); the ZITADEL
`IdpAdmin` driver brings an organisation's login-policy providers and second factors to exactly the listed ones, and the
memory driver keeps a list a later policy leaves out. The infra-identity README names the `identity` machine's roles and
its token as `IDENTITY_IDP_ADMIN_TOKEN`. STA-1263.
