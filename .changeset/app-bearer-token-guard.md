---
"@stackra/app": minor
---

Verify ZITADEL access tokens by JWKS (ADR 0206 decision 8): `BearerTokenGuard` (`./server`, order -50) accepts an
`Authorization: Bearer` JWT only when `verifyBearerToken` (`.`, Web Crypto, RS256 and ES256, never `none` or HS*)
checks its signature against the issuer's key set and its `iss`, `aud`, `exp` and `nbf` under `BearerConfig`
(`app.bearer`, from `STACKRA_BEARER_ISSUER` and `STACKRA_BEARER_AUDIENCE`), refuses with `BearerTokenInvalidError`, and
puts the claims on the request's `VerifiedToken`. The `JsonWebKeys` port (`./contracts`) ships `oidc` (discovery, cached
key set, refetch on an unknown kid, `jwksKeySource` in `.`) and `memory` drivers. The new `workers/edge` Worker shares
the verifier and signs the edge headers `EdgeHeaderGuard` checks.
