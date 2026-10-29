<!-- Stackra file contract. Purpose: the README of @figentra/worker-edge, the Stackra edge Worker: what it does per request, its settings, the host map, the bearer-token check, the signed headers and the owner steps before a first deploy. Boundary: documentation only; ADR 0437 is the decision. Runtime: documentation. Governing contract: ADR 0437; ADR 0206 (decision 8); ADR 0284; ADR 0173. -->

# @figentra/worker-edge

`stackra-edge`, the Cloudflare Worker in front of a Stackra API
([ADR 0437](../../apps/docs/src/docs/adr/0437-the-edge-worker-its-kv-copy-and-the-server-checks.mdx)). It is what
signs the edge headers `EdgeHeaderGuard` (`@stackra/app/server`) checks; without it that guard refuses every
non-public request.

## Per request

1. **Host.** `resolveHost` looks the hostname up in the host map (lower case, trailing dot dropped). An unknown host is
   404; there is no default host.
2. **Bearer token.** A JWT in `Authorization: Bearer …` is verified with `verifyBearerToken` (`@stackra/app`): RS256 or
   ES256 under the issuer's key set (`jwksKeySource`, cached per isolate for `EDGE_OIDC_KEYS_SECONDS`, refetched once
   on an unknown `kid`), `iss`, `aud`, `exp` and `nbf` with `EDGE_TOKEN_LEEWAY_SECONDS`. `none` and HS* are refused. A
   bad token is 401 with `WWW-Authenticate: Bearer error="invalid_token"`. An opaque bearer token (an API key) and any
   other scheme pass on. The header is forwarded untouched: the Worker never authorises (ADR 0437 decision 1), it only
   refuses early; the API still authenticates.
3. **Headers.** Every inbound edge header (`EdgeHeader`: tenant, product, surface, realm, request id, timestamp,
   signature) and `host` are dropped, so a client cannot spoof one.
4. **Sign and forward.** The Worker sets the host's identity headers (no tenant header on a platform host), a new
   request id and the timestamp, and the HMAC of `signEdgeRequest` over them, the method, the path with query and the
   SHA-256 of the body, under `EDGE_SIGNING_SECRET`. It forwards to `EDGE_ORIGIN` with the same path, query, method and
   body. The body is buffered once to hash it.

## Settings

| Var / secret                | Meaning                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `EDGE_SIGNING_SECRET`       | Worker secret (Infisical, ADR 0173): the newest key of the API's `EdgeSigningKeys`     |
| `EDGE_ORIGIN`               | `scheme://host[:port]` the requests go to                                              |
| `EDGE_HOST_MAP`             | JSON: `{ "<host>": { "product", "surface", "realm", "scope"? } }`; `scope` is a tenant |
| `EDGE_OIDC_ISSUER`          | the ZITADEL issuer, exactly the tokens' `iss`                                          |
| `EDGE_OIDC_AUDIENCE`        | the audience a token must name (the ZITADEL project id)                                |
| `EDGE_OIDC_KEYS_SECONDS`    | key-set cache time (at least 60)                                                       |
| `EDGE_TOKEN_LEEWAY_SECONDS` | clock skew on `exp` and `nbf`                                                          |

`readSettings` throws on a missing or malformed var, so a misconfigured Worker fails every request. ZITADEL issues
opaque access tokens unless the app's token type is set to JWT; set it to JWT for the edge to verify them.

## Not yet

The host map is a var, an interim for ADR 0437's KV `host:<hostname>` rows written by the OS edge projector. Host
status (suspended, setup), well-known files, the shell, landing pages, CSP and rate limits (decision 2 steps 2, 3, 5 to
7), per-tenant regional origins and the locked origin path (decision 5) are not here. The ADR places the production
edge Worker in figentra/os; this one is the core reference and the signer for products that run without OS.

## Owner steps before a first deploy

- Add the hosts under `routes` in `wrangler.jsonc` (empty on purpose) and set `EDGE_ORIGIN`, `EDGE_HOST_MAP`,
  `EDGE_OIDC_ISSUER` and `EDGE_OIDC_AUDIENCE`.
- Put `EDGE_SIGNING_SECRET` in Infisical and let CI set it as a Worker secret; give the API the same key through its
  `EdgeSigningKeys` driver.
- Add a deploy workflow (as `deploy-registry.yml`); nobody runs `wrangler deploy` by hand.

## Layout

`src/main.ts` (entry, wiring), `src/http/` (`handleRequest`, `stripEdgeHeaders`), `src/hosts/` (`resolveHost`),
`src/settings/` (`readSettings`), `src/interfaces/`. Tests sit in `__tests__/` beside the code; the signing round trip
is checked against the real `EdgeHeaderGuard`.
