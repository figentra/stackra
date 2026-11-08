---
"@stackra/identity": minor
"@stackra/gen": minor
---

A service now gets its own token from ZITADEL by itself, and sends it on every call to another service.

- `ZitadelServiceTokensDriver` (`zitadel`, in `@stackra/identity/node`) signs in as the service's own ZITADEL
  service account with the JWT profile. It reads the account's key file from the secret store, signs a short-lived
  assertion, and asks the issuer for a token for the receiving product's project. Each token is reused until shortly
  before it expires, and callers asking at the same moment share one request. The key and the tokens are never
  logged, never put in an error and never put in an event. If the issuer refuses, the error is
  `ServiceTokenRefusedError`. If it cannot be reached or is failing, the error is `ServiceTokenUnavailableError`.
- A service that declares `@stackra/app`, `@stackra/clients` and `@stackra/identity` now uses the `service` client
  session and the `zitadel` token driver by default, so its generated clients need no extra wiring.
- If a call goes to a producer module that has no `clients.audiences` entry, the call fails with an error naming that
  module, before any token is fetched. A call is never sent without a token.

What each deployment must set (the values come from the owner or runway, the names are below):

- `identity.service_tokens.issuer`: the ZITADEL issuer URL, the same as the bearer issuer.
- The secret `IDENTITY_SERVICE_ACCOUNT_KEY`: the service account's ZITADEL key file (JSON). Set
  `identity.service_tokens.keySecret` to use another secret name.
- `clients.audiences`: for each producer module the service calls, the project id of the product that serves it.
- In ZITADEL, the service account's access token type must be JWT, because the receiving service checks the token
  against the issuer's public keys.
