# Threat model: @stackra/app

<!--
Stackra file contract:
Purpose: the threat model of @stackra/app: the server's request guards (edge signature, origin, CSRF, bearer token),
         `CallAuthenticator`, `serveGuardedCall`, CORS and cache headers, service-to-service tokens, readiness and
         shutdown, and the session on a route.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC1, SEC7 and SEC10; ADR 0437 (decisions 4 and 8); ADR 0209 (and its amendment of
                    2026-11-07); ADR 0206 (decision 8); ADR 0278; ADR 0325 (rule 22); ADR 0207 (amendment of 2026-11-26:
                    the ASVS level); STA-1374; STA-2577; STA-316.
-->

ASVS level: L2 for V2 (authentication), V3 (session management) and V4 (access control); L1 for every other chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Every HTTP call into a Stackra service passes this package first: the body is read under a size limit, the request
guards run in a fixed order, `CallAuthenticator` turns the `Authorization` header into an actor, and only then does the
action pipeline see the call. Its threats are a request that reaches a handler without proving who sent it, cross-site
use of the cookie session, and a token forwarded further than it should go.

## Assets

| Asset                              | Where it lives                                               | Class      |
| ---------------------------------- | ------------------------------------------------------------ | ---------- |
| Edge signing keys                  | `STACKRA_EDGE_SIGNING_KEYS`, read blind (`env` driver)       | `secret`   |
| Seen edge request ids              | `EdgeNonceStore` (`memory`, per instance)                    | `internal` |
| The issuer's public keys           | the `oidc` `JsonWebKeys` driver's cache (an hour)            | `internal` |
| A held user token for a second hop | the call's async context only, emptied when the call ends    | `secret`   |
| The service's own token key        | `IDENTITY_SERVICE_ACCOUNT_KEY` (through `@stackra/identity`) | `secret`   |
| Request bodies                     | memory, read once under `HttpConfig.maxBodyBytes`            | `pii`      |

## Trust boundaries

1. The internet or the edge Worker to the service's HTTP adapter.
2. The edge Worker's signed headers to `EdgeHeaderGuard`.
3. A bearer token to `CallAuthenticator` and the issuer's JWKS.
4. This service to another service's generated client (service token, optional on-behalf-of token).

## Threats and controls

| Threat                                                       | Control today                                                                                                                                                       | Open work                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A forged or expired token is accepted                        | RS256/ES256 only (`none`, HS* and mismatched keys refused); issuer, audience, expiry and not-before with 60 s leeway; a bad `Authorization` is 401, never anonymous | —                                                            |
| An unknown signing key lets an attacker force key refetches  | An unknown `kid` refetches at most once every 30 seconds                                                                                                            | —                                                            |
| A request that bypassed the edge claims a tenant or realm    | Any edge header means the request must verify: HMAC over headers, method, path and body hash, ±60 s, newest key first; then the request id is claimed               | The production edge, STA-2793                                |
| A captured edge request is replayed against another instance | None across instances: the nonce store is `memory`, so a replay is refused per instance only                                                                        | Shared nonce store, STA-2803                                 |
| Cross-site request forgery on the cookie session             | `OriginGuard` (own origin or `allowedOrigins`; a cookie with no origin is refused) and `CsrfGuard` (custom header, or double-submit in constant time)               | —                                                            |
| A third-party site reads API answers with the user's cookie  | CORS echoes only exact allowed origins, no wildcard; credentials only for those                                                                                     | —                                                            |
| A shared cache stores a personal answer                      | Any request with `Authorization` or a cookie, and any answer that sets one, is `private, no-store`                                                                  | —                                                            |
| A user token travels further than one hop                    | Forwarded only on a declared `onBehalfOf: { secondHop: true }`; never on the actor, a log, an error or an event; a hand-written controller forwards none            | —                                                            |
| A service call goes out unauthenticated                      | A producer module with no audience fails before any token is asked for                                                                                              | —                                                            |
| An oversized body exhausts memory                            | The body is read once under `HttpConfig.maxBodyBytes` (413)                                                                                                         | Load shedding and bulkheads, STA-1467                        |
| Guard or authentication failures leak why                    | Every guard or authenticator failure is one generic 401 or 403; readiness answers name the dependency, never its detail                                             | Typed statuses and the error envelope for refusals, STA-2048 |
