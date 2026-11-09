# @stackra/app

## 0.32.0

### Minor Changes

- 33f61e5: Every app shows dates in the tenant's calendar with no wiring of its own: `Contexts`' `i18n` context reads the
  tenant's `DisplaySettings.calendar` (`@stackra/settings`) through the container's `SettingsReader` and passes it to
  `I18nProvider`, so `useDateTime` writes Hijri dates for a tenant on the Umm al-Qura calendar. Gregorian until the read
  answers, and where no reader is bound.

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/clients@0.32.0
  - @stackra/navigation@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/csp@0.32.0
  - @stackra/identity@0.32.0
  - @stackra/settings@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [0f05f60]
  - @stackra/actions@0.31.0
  - @stackra/i18n@0.31.0
  - @stackra/clients@0.31.0
  - @stackra/identity@0.31.0
  - @stackra/navigation@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/validation@0.31.0
  - @stackra/csp@0.31.0

## 0.30.0

### Minor Changes

- 4ce80a2: An anonymous call acts in the tenant the edge Worker signed (`EdgeHeader.Scope`, ADR 0437): `EdgeHeaderGuard` records
  the scope once the signature and the request id verify, and `serveGuardedCall` gives it to the anonymous actor as its
  `scopeId`, its visitor id kept. A credential's tenant wins; a token or an API key whose tenant differs from the signed
  one is refused with the generic 403; no signed scope means no tenant. A signed scope that is not an `scp_` public id
  is refused (fail closed). `@stackra/contracts` adds `isPublicId(value, prefix)`, a type guard for a string in public id
  form.
- 04d04e4: API keys reach the action pipeline: `CallAuthenticator` verifies a bearer that is an API key with identity's
  `ApiKeyVerifierService` and answers its principal as an `api_client` actor with the key's call options
  (`KeyCallOptions`: credential, origin, sandbox for a test key); a forwarded user token beside a key is refused.
  `serveGuardedCall` reads `Origin` for it and hands the options to `execute`, and gen's adapters pass them to
  `ActionPipeline#execute`. Run `stackra gen` after upgrading.
- 7d60f82: `EdgeHeaderGuard` is bound in every generated service and checks edge traffic only. A request that carries any edge
  header must verify (fail closed); a request with none is not edge traffic and goes on to authentication or its
  endpoint's own signature check, so service calls, cross-app deliveries and webhooks keep working. `publicPaths` is
  removed from the guard. New `EdgeConfig` (`app.edge`) chooses the drivers: `keys` is `memory` or `env`, which reads the
  `STACKRA_EDGE_SIGNING_KEYS` secret (newest first, comma-separated); `nonces` is `memory`, so a replay is refused per
  instance until a shared nonce store ships.
- 0765ecc: Runway publishes a pull request's preview (STA-1907, ADR 0289 decision 7).
  
  - `publishProduct({ environment: "preview", pullRequest: n })` uploads the console bundle and writes
    `host:<product>-pr-<n>.figentra.cloud` and `release:<product>:console:pr-<n>`, both expiring after 7 days, with no canary; the
    answer carries `host`. A host row another product holds is refused before any upload. `pullRequestPreviewHost(product, n)` and `PULL_REQUEST_PREVIEW_SETTINGS` are exported.
  - `EdgeKvWriter.put(key, value, ttlSeconds?)` takes an optional expiry; `WranglerEdgeKvDriver` passes it as `--ttl`.
  - `EdgeKvWriter.read(key)` answers the row or `null`; every driver implements it (wrangler's `kv key get --text`,
    where the API's 404 is `null`).
  - The product command takes `--pr <n>` (or `STACKRA_PULL_REQUEST`) with `--env preview` (digits only), and prints the host.
- cd2496b: An anonymous caller keeps one visitor id across requests. `serveGuardedCall` resolves the visitor from a signed token
  (the `stackra-visitor` header, else the httpOnly `stackra_visitor` cookie) through `VisitorIdentityService`, and an
  answer to a new visitor, or one signed with the previous key, carries the token back. The token is an HMAC-SHA-256
  over the `anon_` id with the `STACKRA_VISITOR_SIGNING_KEY` secret (`STACKRA_VISITOR_SIGNING_KEY_PREVIOUS` is accepted
  for rotation). Until the secret is set, every anonymous call is a new visitor, as before. Gen's adapter fills the
  new `visitor` seam.

### Patch Changes

- 0394e56: `serveGuardedCall` answers `idempotency_key_in_progress` with its 409 envelope and `Retry-After: 1`.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [38808c2]
- Updated dependencies [336eacc]
- Updated dependencies [751dd95]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [d5a7d0a]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/identity@0.30.0
  - @stackra/container@0.30.0
  - @stackra/clients@0.30.0
  - @stackra/navigation@0.30.0
  - @stackra/config@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/csp@0.30.0

## 0.29.0

### Minor Changes

- 3361957: An action whose actors are exactly `[ActorKind.Anonymous]` may declare `credentials: "ignore"`, for a public page whose visitors may also be signed in elsewhere. The pipeline then runs a signed-in caller's call as a fresh anonymous actor and drops what the credential gave, and `serveGuardedCall` never verifies or holds that credential, so no user token is forwarded. Without the option such an action still refuses a signed-in caller. `Action({...})` throws, and gen refuses `credentials_ignore_not_anonymous`, when the actors are anything else. Limit: a host's optional `BearerTokenGuard` runs before the adapter, so it can still refuse an expired or invalid token on such an action; a host that serves these actions should let them pass that guard.

### Patch Changes

- Updated dependencies [b4b6422]
- Updated dependencies [0e8f570]
  - @stackra/container@0.29.0
  - @stackra/clients@0.29.0
  - @stackra/identity@0.29.0
  - @stackra/navigation@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/csp@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/clients@0.28.0
  - @stackra/identity@0.28.0
  - @stackra/navigation@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/validation@0.28.0
  - @stackra/csp@0.28.0

## 0.27.0

### Patch Changes

- @stackra/identity@0.27.0
  - @stackra/clients@0.27.0
  - @stackra/navigation@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/validation@0.27.0
  - @stackra/csp@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [9b02a7c]
  - @stackra/identity@0.26.0
  - @stackra/clients@0.26.0
  - @stackra/navigation@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/i18n@0.26.0
  - @stackra/validation@0.26.0
  - @stackra/csp@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [fd0e4a9]
  - @stackra/identity@0.25.0
  - @stackra/clients@0.25.0
  - @stackra/navigation@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/i18n@0.25.0
  - @stackra/validation@0.25.0
  - @stackra/csp@0.25.0

## 0.24.0

### Patch Changes

- @stackra/clients@0.24.0
  - @stackra/identity@0.24.0
  - @stackra/navigation@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/validation@0.24.0
  - @stackra/csp@0.24.0

## 0.23.0

### Minor Changes

- c26fb86: Every generated HTTP adapter is an Encore raw endpoint that runs the request guards (STA-2577, ADR 0237 note of
  2026-11-08). `@stackra/app/server` adds `serveGuardedCall` and `HttpConfig` (`app.http`, `maxBodyBytes`, 1 MiB by
  default): the body is read once under the cap (413), every `RequestGuard` runs over the exact bytes (so the edge
  signature covers the body), `CallAuthenticator` verifies an `Authorization` header (a bad one is refused, never
  anonymous), then the input is parsed and the action pipeline runs; guard and authentication failures are one generic
  401 or 403. `@stackra/gen` now writes `api.raw()` endpoints (auth: false to Encore) for actions, queries and
  controllers through `answerCall` in `http.ts`, binds `app.http` in the wiring, and no longer writes `auth.ts` or the
  `Gateway`.
  
  GET and DELETE query strings are typed by the call's registered input schema (`coerceQueryInput`): finite numbers,
  `"true"` and `"false"`, and arrays element-wise; enums and strings stay as sent, and a value that does not fit stays a
  string so validation refuses it. A void output answers 200 `null`.
  
  New reachable surface: the typed `api()` skipped every entry whose input or output was not a schema class of the
  member, so those had no HTTP route. They now get one, behind the same guards, authentication and permission checks:
  generated search and report queries, replica queries (`ReplicaPage` output) and any other action or query whose
  schemas come from a package. The gen fixtures show it only for the billing unit fixture (`BILLING_IR`), and no golden
  gains an endpoint. A hand-written `Controller` is now served too (every method, behind the guards), reachable with no
  `Authorization` header; a present but invalid or expired one is 401 and never falls back to anonymous.
- a42a80c: A service now proves who it is when it calls another service, and who it acts for.
  
  - An outgoing service call sends the service's own token (`Authorization: Bearer`). `ServiceTokens` in
    `@stackra/identity` answers it, with a memory driver for tests; the token is issued for the receiving product's
    project, set per module in `clients.audiences`.
  - When the call acts for a user, it also sends that user's own token in `Stackra-On-Behalf-Of`. `serveGuardedCall` in
    `@stackra/app/server` keeps that token for the one request and empties it when the request ends. It is never put on
    the actor, the call context, a log, an error or an event.
  - A user's token travels one hop. A service called for a user forwards it again only into an action that declares
    `onBehalfOf: { secondHop: true }`; otherwise its own calls carry the service token alone.
  - `ServiceClientSessionDriver` (`service`) is the `ClientSession` a service binds for its generated clients, and
    `ClientSession.headers` now receives the call it is about to send.
  - Generated endpoints name their action to `serveGuardedCall`, which reads its second-hop option. A hand-written
    controller forwards only a user's own token, never a forwarded one.

### Patch Changes

- 6edeee4: Peers no longer fork a product's install. pnpm gives a package one variant per set of resolved peers, so an optional
  peer one member installs and another does not split every dependent in two: a product with connectors (react-dom for
  their tests) and a pglite service resolved two copies of @stackra/integrations, whose classes then failed each other's
  checks. `@stackra/database`'s test-only packages (PGlite and its extensions, Faker, Testcontainers) are no longer peers:
  its testing entry loads them from the member running the tests, as their devDependencies. `react-dom` is a required peer
  of `@stackra/ui`, `@stackra/app` and `@stackra/notifications`. `stackra validate` refuses a test-only package as a
  library's peer and an optional `react-dom` (`forking-peers`).
- Updated dependencies [c8998d9]
- Updated dependencies [a42a80c]
- Updated dependencies [f790fa1]
  - @stackra/identity@0.23.0
  - @stackra/clients@0.23.0
  - @stackra/navigation@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/validation@0.23.0
  - @stackra/csp@0.23.0

## 0.22.0

### Patch Changes

- 940e198: Calls from branch users now work, directly and through a service or an agent. A user's token is often issued for a
  branch, so the user's `scopeId` is the branch's id, not the tenant's. `CallIsolationDriver` used to compare those ids
  as they were, so a branch user was refused in its own tenant, and so was a service or an agent of the tenant acting
  for that user. It now reads every scope a user, an agent or a service claims through the scope tree and compares
  tenants: a branch counts as the tenant above it, and the call runs with that tenant set, never the branch id. A user
  from another tenant's branch is still refused, and so is a claimed scope the tree does not show or one above every
  tenant (`tenant_scope_mismatch`). A tree read that fails fails the call; it never lets the call through.
  
  `CallAuthenticator` no longer compares the service's and the user's scope ids itself, since it cannot see the tree;
  `CallIsolationDriver` now owns that rule.
- Updated dependencies [2dd98e6]
- Updated dependencies [1d5d185]
  - @stackra/csp@0.22.0
  - @stackra/identity@0.22.0
  - @stackra/navigation@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/i18n@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Minor Changes

- ae9cb23: One generated Encore auth handler for user and service calls (ADR 0209, amendment of 2026-11-07, point 5).
  `@stackra/app/server` adds `CallAuthenticator`: it reads `Authorization: Bearer`, verifies the token with
  `verifyBearerToken` under `BearerConfig` and the bound `JsonWebKeys`, and maps it to its actor with
  `@stackra/identity`'s `actorOf`, answering `{ userID, actor }` (`CallAuthData`). Every failure is one
  `BearerTokenInvalidError`, with no detail and never the token; a `Stackra-On-Behalf-Of` header is refused until the
  forwarded user token is verified. For a service with endpoints, `@stackra/gen` now writes
  `.stackra/encore/<member>/auth.ts`: the app's one `authHandler` over those two headers, which runs `CallAuthenticator`
  and answers `APIError.unauthenticated` on its refusal, and the app's one `Gateway`.
- f184d12: A service can now call for a user (ADR 0209, amendment of 2026-11-07). The calling service sends its own token as
  `Authorization: Bearer` and the user's own access token in `Stackra-On-Behalf-Of`. `CallAuthenticator` verifies both
  with the same issuer, audience and leeway, and the call becomes the service acting for that user:
  `{ kind: "service", id: "svc_…", scopeId?, onBehalfOf: <the user> }`. The forwarded token itself is never kept; only
  the user it names travels. A forward is refused when it sits beside a user token or no token, when it has expired or
  names another audience, when it is a service's token, or when the service is bound to a tenant other than the user's.
  
  The call then runs in the user's tenant: `actingScopeId` gives a service with no tenant of its own the tenant of the
  user it calls for, as it already did for an agent. `CallIsolationDriver` treats a service like an agent: it refuses
  one whose own tenant differs from its user's, and one with a tenant whose scope sits above every tenant or is not in
  the scope tree (`tenant_scope_mismatch`). A service with no tenant and no user stays a platform call, as before.

### Patch Changes

- Updated dependencies [e871d59]
- Updated dependencies [a785356]
- Updated dependencies [1073d9c]
- Updated dependencies [f184d12]
  - @stackra/csp@0.21.0
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/identity@0.21.0
  - @stackra/navigation@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/i18n@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [cc87438]
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/identity@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/navigation@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/csp@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Minor Changes

- cb26737: Secrets now come from SOPS files keyed by Google Cloud KMS, not Infisical (ADR 0525). `@stackra/config` no longer
  ships the Infisical secret store: `InfisicalSecretStoreDriver`, `InfisicalConfig`, `InfisicalConfig$` and
  `InfisicalOptions` are removed, with the `infisical` candidate of the `SecretStore` port and the
  `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` env rows. The `SecretStore` candidates are now `memory` and
  `aws_secrets_manager`; a deployed runtime still reads the platform's own store through `envSecrets`. Re-run
  `stackra gen` after upgrading so a committed `stackra.manifest.json` drops the `infisical` candidate. The other
  packages only update comments and docs that named Infisical as the runtime store.

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [581af77]
- Updated dependencies [3a894fa]
- Updated dependencies [0da5f7a]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
  - @stackra/contracts@0.19.0
  - @stackra/identity@0.19.0
  - @stackra/config@0.19.0
  - @stackra/csp@0.19.0
  - @stackra/navigation@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/validation@0.19.0

## 0.18.1

### Patch Changes

- @stackra/identity@0.18.1
  - @stackra/navigation@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/csp@0.18.1

## 0.18.0

### Patch Changes

- @stackra/identity@0.18.0
  - @stackra/navigation@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/csp@0.18.0

## 0.17.2

### Patch Changes

- @stackra/identity@0.17.2
  - @stackra/navigation@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/csp@0.17.2

## 0.17.1

### Patch Changes

- @stackra/identity@0.17.1
  - @stackra/navigation@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/csp@0.17.1

## 0.17.0

### Patch Changes

- @stackra/navigation@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/csp@0.17.0
  - @stackra/identity@0.17.0

## 0.16.0

### Patch Changes

- 64cfc1d: `bootApp` binds the environment as the `SecretStore` port unless the caller overrides it, so a driver that reads a secret
  by name (the cross-app event signer, STA-1910) resolves in a generated service.
- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/navigation@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/csp@0.16.0
  - @stackra/identity@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/identity@0.15.0
  - @stackra/navigation@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/csp@0.15.0

## 0.14.4

### Patch Changes

- Updated dependencies [cc150d2]
  - @stackra/navigation@0.14.4
  - @stackra/identity@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/csp@0.14.4

## 0.14.3

### Patch Changes

- @stackra/navigation@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/csp@0.14.3
  - @stackra/identity@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/navigation@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/identity@0.14.2
  - @stackra/csp@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/navigation@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/csp@0.14.1
  - @stackra/identity@0.14.1

## 0.14.0

### Patch Changes

- @stackra/navigation@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/csp@0.14.0
  - @stackra/identity@0.14.0

## 0.13.0

### Patch Changes

- @stackra/navigation@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/csp@0.13.0
  - @stackra/identity@0.13.0

## 0.12.0

### Patch Changes

- @stackra/navigation@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/csp@0.12.0
  - @stackra/identity@0.12.0

## 0.11.1

### Patch Changes

- @stackra/navigation@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/csp@0.11.1
  - @stackra/identity@0.11.1

## 0.11.0

### Patch Changes

- @stackra/navigation@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/csp@0.11.0
  - @stackra/identity@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/navigation@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/csp@0.10.0
  - @stackra/identity@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [378f6a6]
- Updated dependencies [e80a99b]
- Updated dependencies [681d01a]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/identity@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/navigation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/csp@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/identity@0.8.0
  - @stackra/navigation@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/csp@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/identity@0.7.1
  - @stackra/navigation@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/csp@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
  - @stackra/identity@0.7.0
  - @stackra/navigation@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/csp@0.7.0

## 0.6.1

### Patch Changes

- @stackra/navigation@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/csp@0.6.1
  - @stackra/identity@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [99750d4]
  - @stackra/navigation@0.6.0
  - @stackra/identity@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/csp@0.6.0

## 0.5.1

### Patch Changes

- @stackra/identity@0.5.1
  - @stackra/navigation@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/validation@0.5.1
  - @stackra/csp@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/navigation@0.5.0
  - @stackra/identity@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/csp@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/identity@0.4.0
  - @stackra/navigation@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0
  - @stackra/csp@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- d5b5411: The `react-router` peer is `^7.18.4` instead of the exact `7.18.4`, so a consumer can take react-router's later 7.x
  security fixes without an override (STA-1736).
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [4a6abd7]
- Updated dependencies [895a526]
- Updated dependencies [ccc0b0f]
- Updated dependencies [d5b5411]
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/csp@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/identity@0.3.0
  - @stackra/navigation@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- 20eea53: Verify ZITADEL access tokens by JWKS (ADR 0206 decision 8): `BearerTokenGuard` (`./server`, order -50) accepts an
  `Authorization: Bearer` JWT only when `verifyBearerToken` (`.`, Web Crypto, RS256 and ES256, never `none` or HS*)
  checks its signature against the issuer's key set and its `iss`, `aud`, `exp` and `nbf` under `BearerConfig`
  (`app.bearer`, from `STACKRA_BEARER_ISSUER` and `STACKRA_BEARER_AUDIENCE`), refuses with `BearerTokenInvalidError`, and
  puts the claims on the request's `VerifiedToken`. The `JsonWebKeys` port (`./contracts`) ships `oidc` (discovery, cached
  key set, refetch on an unknown kid, `jwksKeySource` in `.`) and `memory` drivers. The new `workers/edge` Worker shares
  the verifier and signs the edge headers `EdgeHeaderGuard` checks.
- 9085c41: OTLP for all three signals (ADR 0184 decision 1, STA-1572). `@stackra/contracts`: `Tracer` gains
  `continueTrace(carrier, work)` and `traceparent()` (implementers of `Tracer` must add both; `NoopTracerDriver` runs the
  work and names no parent), the `TraceCarrier` type, and a new `Metrics` port (counter, histogram, gauge) with
  `NoopMetricsDriver`. `@stackra/logger`: `OtlpTracerDriver` (spans to `/v1/traces`, nesting through
  `AsyncLocalStorage`, W3C trace continuation, the edge request id on every span, `traceSampleRatio` sampling) and
  `OtlpMetricsDriver` (cumulative sums, gauges and explicit-bucket histograms to `/v1/metrics` every
  `metricIntervalMs`), `parseTraceparent` and `formatTraceparent`; `OtlpConfig` adds `traceSampleRatio` and
  `metricIntervalMs`; the log reporter shares the batching sender, counts what it drops (`dropped`) and flushes on
  shutdown. `@stackra/transport`: the `traceContext(tracer)` middleware and `TRANSPORT_HEADERS.traceparent`.
  `@stackra/app`: the server `createApp` continues each request's trace (its `traceparent` and `x-figentra-request-id`,
  taken once the guards pass) when a `Tracer` is bound.

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [a167045]
- Updated dependencies [48be198]
- Updated dependencies [7487ba8]
- Updated dependencies [d37c08f]
- Updated dependencies [f7ae148]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/identity@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/navigation@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0
  - @stackra/csp@0.2.0

## 0.1.0

### Minor Changes

- 854d7a9: Add `apiCacheControl` to `@stackra/app/server` (ADR 0325 rule 22): an API answer to a signed-in request (an
  `Authorization` header or any cookie) or an answer that sets a cookie is `private, no-store`, over the handler's own
  header. The generated HTTP adapter (`answerHttp`) applies it to every answer (STA-1448).
- 28aa224: The server `createApp` no longer passes `url` (the process's `DATABASE_URL`) to the generated boot:
  `ServerAppOptions["boot"]` takes `{ signal }` only, since the boot connects with its service's Encore database url
  (STA-1401). The migrate and seed CLIs keep reading `DATABASE_DIRECT_URL`, else `DATABASE_URL`, through
  `directDatabaseUrl()` of `@stackra/database/node`.
- c547718: Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9; `createApp`, `BRIDGE_CHANNEL` and `DesktopApp` keep
  their names), and add the health probe to `./server`: `ServerAppOptions.health` takes `HealthIndicator`s, and
  `ServerApp.probe(method, path)` answers `GET /healthz` (200 until a drain) and `GET /readyz` (every indicator, each
  with a timeout; 200 when none is down, 503 otherwise; a status per name, no detail).
- 1821909: Add the signed edge-header guard (ADR 0437 decision 4): `EdgeHeaderGuard`, the first `RequestGuard`, accepts
  the Worker's identity headers only with an HMAC under one of the active signing keys (two during a rotation), a
  timestamp inside the 60-second window and an unseen request id, and refuses with `EdgeSignatureInvalidError`.
  `signEdgeRequest` (`.`) fixes the signed bytes for the Worker and the API; the `EdgeSigningKeys` and
  `EdgeNonceStore` ports (`./contracts`) ship with `memory` drivers.
- 99321e1: Add the origin and CSRF guards and the CORS configuration for the BFF cookie session (gap analysis P0, STA-1374):
  `OriginGuard` (order -90) lets a state-changing request through only from the API's own origin or
  `CorsConfig.allowedOrigins`, refusing a cookie with no origin (`OriginNotAllowedError`, 403); `CsrfGuard` (order -80)
  needs `CsrfConfig.headerName` on a cookie-authenticated state change, and the token cookie's value in double-submit
  mode (`CsrfTokenInvalidError`, 403); `corsHeaders` answers preflights and responses from `CorsConfig` (origins,
  methods, headers, credentials, max-age). Every value is a setting (`app.cors`, `app.csrf`). New dependencies:
  `@stackra/validation`, `zod`.
- 2787c1e: Add `@stackra/app`, the app runtime of the programming model v3.1: `createApp` for each runtime target, returning that
  target's object (ADR 0295 decision 8). `./server` gives `ServerApp` (`key`, `ready()`, `drain()`, `close()`,
  `handlers`, with signal handling and exit codes) and the `Controller` kind for raw HTTP; `./worker` gives `WorkerApp`
  (`fetch`, the crash page on any throw) and `WorkerRequest<E>`; `./browser` gives `BrowserApp` (`hydrate({ nonce })`,
  `mount(root)`, `router`) and `hydrateRoute` for one prerendered page; `./native` gives `NativeApp` (`Root`, booting
  behind the splash); `./electron` gives `DesktopApp` (`start()`, `windows`) with the hardening baseline and the bridge
  channel. `.` holds the shared `bootApp` and the `AppWiring` token; `./react` holds `Contexts`, mounted in graph order,
  and `registerContext`.
- d72a734: `/readyz` now runs every `HealthIndicator` the container binds as well as the `health` given to `createApp`, so the package health drivers fail readiness, by name, when a critical dependency does not answer (STA-1379).
- 1a7597c: Add the `RequestGuard` extension point to `./server` and `ServerApp.handlers.guard(request, container)`, which runs
  every contributed guard lowest `order` first and stops at the first refusal. Add `session` and `identity` to
  `@stackra/navigation`'s `RouteServices` (`RouteSession`): the Worker loads the session into each request container,
  the browser and native targets at boot, so a layout can gate on `ctx.session` (ADR 0457).
- c526bed: A service's generated server entry now hands `createApp` its `#stackra/boot`
  (`createApp(Root, { wiring, boot })`), and the server `createApp` awaits it once the container is ready with
  `DATABASE_URL` and a shutdown signal that `close()` aborts after the drain, so the bus, inbox and relay connect at
  service start and stop on shutdown. The generated `boot` connects nothing when the signal has already aborted, and
  disconnects the bus and inbox at once when it aborts mid-boot.

### Patch Changes

- ae3d280: Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
  `@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [ffce16f]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [8377336]
- Updated dependencies [1c230bd]
- Updated dependencies [51d83d1]
- Updated dependencies [2787c1e]
- Updated dependencies [0006947]
- Updated dependencies [0f96a66]
- Updated dependencies [e3be0c3]
- Updated dependencies [391f64d]
- Updated dependencies [2bf1a5d]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [eb2628a]
- Updated dependencies [396e384]
- Updated dependencies [2787c1e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [90957bd]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [69e90f1]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/csp@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/identity@0.1.0
  - @stackra/navigation@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
