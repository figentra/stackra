---
"@stackra/identity": minor
---

`IdpAdmin.installClaimsAction({ endpoint, timeoutSeconds? })` makes the provider add the Stackra claims to every
token and userinfo answer. On ZITADEL it is an Actions v2 `restCall` target named `stackra-claims` that fails the token
when the endpoint fails, plus the `preuserinfo` and `preaccesstoken` function executions. The first install answers the
target's signing key once, and a later install repoints the target and answers none. `claimsActionResponse(claims)` is
the endpoint's answer: `append_claims` for every `IDENTITY_CLAIMS` name, the realm included. `StackraClaims` types its
input. The endpoint verifies each call with the existing `verifyZitadelSignature`.
