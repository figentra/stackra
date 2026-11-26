# @stackra/identity

## 0.33.1

### Patch Changes

- e885a38: A service no longer refuses to boot with "its drivers are X, Y, and no config field selects one" for six ports: each now has a config field that picks its driver, with a default. `DatabaseConfig.driver` selects `Database` (`postgres`; `memory` stays the testing driver a test picks with `useDrivers`). The new `SettingsConfig` (key `settings`) holds `store` for `SettingValueStore` and `floors` for `SettingFloorSource`, both `memory`. The new `StorageConfig` (key `storage`) holds `driver` for `Storage` (`memory`; an app still gets `web` or `native` from gen's per-runtime defaults, which come first). `IdentityConfig` gains `sessionStore` for `SessionStore` and `approvalChallenges` for `AppApprovalChallenges`, both `memory`. The ports `Database`, `Storage` and `AppApprovalChallenges` declare their keys, so `DriverName<…>` narrows to their drivers. Production sets `settings.store`, `settings.floors`, `storage.driver` and `identity.approval_challenges` in config to choose its own drivers.
- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/database@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/tenancy@0.33.1
  - @stackra/storage@0.33.1
  - @stackra/scheduler@0.33.1
  - @stackra/outbox@0.33.1
  - @stackra/queue@0.33.1
  - @stackra/iam@0.33.1
  - @stackra/privacy@0.33.1
  - @stackra/scope@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/clients@0.33.1
  - @stackra/ui@0.33.1
  - @stackra/config@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/events@0.33.1
  - @stackra/market-packs@0.33.1
  - @stackra/transport@0.33.1
  - @stackra/validation@0.33.1
  - @stackra/query@0.33.1
  - @stackra/support@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [4937622]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [7c34d68]
- Updated dependencies [26a2d54]
- Updated dependencies [7c34d68]
- Updated dependencies [7c34d68]
- Updated dependencies [03da426]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [22493bf]
  - @stackra/actions@0.33.0
  - @stackra/scope@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/iam@0.33.0
  - @stackra/queue@0.33.0
  - @stackra/market-packs@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/database@0.33.0
  - @stackra/ui@0.33.0
  - @stackra/clients@0.33.0
  - @stackra/outbox@0.33.0
  - @stackra/scheduler@0.33.0
  - @stackra/privacy@0.33.0
  - @stackra/query@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/storage@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/transport@0.33.0
  - @stackra/validation@0.33.0
  - @stackra/support@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
- Updated dependencies [2c6be3c]
- Updated dependencies [54db249]
  - @stackra/config@0.32.0
  - @stackra/scope@0.32.0
  - @stackra/ui@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/clients@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/market-packs@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/scheduler@0.32.0
  - @stackra/privacy@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/query@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/transport@0.32.0
  - @stackra/storage@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/support@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [7179d1a]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/clients@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/scheduler@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/privacy@0.31.0
  - @stackra/scope@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/query@0.31.0
  - @stackra/storage@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/market-packs@0.31.0
  - @stackra/support@0.31.0
  - @stackra/transport@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 336eacc: An API key has a mode, test or live, written into its text after the kind's prefix (`stackra_sk_test_…`).
  `mintApiKey(kind, config, mode)` takes it (live by default), `parseApiKey` and `VerifiedApiKey` answer it, and a key
  minted before modes reads as live. `ApiKeyRecord` gains `mode` and `versionPin`; the verifier refuses a key whose text
  names another mode than its record. New `ApiKeyMode` enum in `./contracts`.
- 751dd95: `ServiceApiKeyStoreDriver` (`./node`, driver `service`): the `ApiKeyStore` of a service that answers API-key calls. It
  reads a key's record from the identity service by hash (`principals.api_key.verify@1`), caches a verified record for
  the new `IdentityConfig.apiKeyCacheSeconds` (30 by default), never caches an unknown key, and forgets a principal's
  records at once on `evictPrincipal` (a revoke). Worst case after a revoke whose event has not arrived: the cache window.
- d5a7d0a: **Breaking route change.** Every action and query route now sits under its API area. Gen prefixes each derived route with `/<area>`: the
  action's or query's `area`, else the service's own `defineService({ area })`, else `app` (`PUT
  /app/orders/:orderId/cancel`). Every manifest action entry records its `area`, so the committed manifests,
  `openapi.json` and the SDKs move to the prefixed paths.
  
  Gen also refuses, in its full pass (STA-340):
  
  - `endpoint_collision`: two calls on one method and path once parameter names are erased (`GET /app/orders/:orderId`
    and `GET /app/orders/:id`). Until now `openapi.json` silently kept only one of them.
  - `endpoint_versioned`: a `v<digits>` path segment (paths stay unversioned; API versions are dates).
  - `endpoint_area_mismatch`: an `endpoint: { method, path }` override outside its area's prefix.
  - `endpoint_method_mismatch`: a query not on `GET`, an action on `GET`, or a transition overridden away from `PUT`.
  - `job_without_system_actor`: a `job` without the `system` or `job` actor.
  - `cron_input_invalid`: a `job.cron.input` property the input schema does not have, a required one it omits, or a
    value of another JSON type.
  - `intent_phrases_missing`: `intent: true` without a non-empty `actions.<key>.intents` list in a base-language
    catalogue.
  
  The routes outside their area move under it: loyalty-kit's five overrides to `/app/loyalty/...`, the award
  verification to `GET /public/awards/verify`, `CONSENT_SNAPSHOT_PATH` to `/public/consent/snapshots`,
  `ANALYTICS_INGEST_PATH` to `/public/analytics/batches`, `DEVICE_ORDER.acknowledgedPath` to
  `/app/devices/acknowledged` and `CLIENT_RESULT_ACTION.path` to `/app/runs/:runId/client-result`. The committed
  `stackra.manifest.json` of every package with a route (access-log, collaboration, data-maintenance, devices, identity,
  media, privacy, segments, tenancy, webhooks and the packages above) records each entry's `area` and its prefixed path.
  
  The identity lock accepts this move once: an endpoint whose new route is exactly `/<its own area>` plus the locked
  path, with the same method, keeps its identity without `@Renamed`. A move to another area, a method change, or a route
  that already started with an area moving again is still refused with `identity_changed`.
  
  What a product does on its bump: run `stackra gen` and commit the regenerated `stackra.manifest.json` and
  `openapi.json` of each member. Nothing else; no `@Renamed`. Clients regenerate from the new manifests, so a caller
  pinned to an old path (none before launch) would need the prefixed one.

### Patch Changes

- 38808c2: A mode is never assumed: `parseApiKey` answers no mode for a key without a mode segment, and the verifier refuses a
  key whose text or record has no mode, so live comes only from a key issued live.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [85cd1b5]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [265a3ee]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/actions@0.30.0
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/scheduler@0.30.0
  - @stackra/privacy@0.30.0
  - @stackra/container@0.30.0
  - @stackra/clients@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/scope@0.30.0
  - @stackra/query@0.30.0
  - @stackra/storage@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/market-packs@0.30.0
  - @stackra/transport@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [8ad5f87]
- Updated dependencies [11a19a7]
- Updated dependencies [0e8f570]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/scope@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/clients@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/scheduler@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/privacy@0.29.0
  - @stackra/query@0.29.0
  - @stackra/storage@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/market-packs@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/transport@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/scheduler@0.28.0
  - @stackra/clients@0.28.0
  - @stackra/database@0.28.0
  - @stackra/outbox@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/privacy@0.28.0
  - @stackra/scope@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/query@0.28.0
  - @stackra/storage@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/market-packs@0.28.0
  - @stackra/support@0.28.0
  - @stackra/transport@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [8a70552]
  - @stackra/database@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/scheduler@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/privacy@0.27.0
  - @stackra/scope@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/clients@0.27.0
  - @stackra/query@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/storage@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/market-packs@0.27.0
  - @stackra/support@0.27.0
  - @stackra/transport@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- 9b02a7c: A host binds the actions and queries of each package module it hosts, as it does that package's services: they are
  the module's surface, so a test or a client can call one by class (`run(EnrollMemberAction, …)`) without a host class
  injecting it. A published package's manifest lists its actions and queries in `services` with their constructor
  tokens, and the host wiring binds each one with them.
- Updated dependencies [93e358e]
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
- Updated dependencies [e5da198]
  - @stackra/database@0.26.0
  - @stackra/privacy@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/ui@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/scheduler@0.26.0
  - @stackra/scope@0.26.0
  - @stackra/query@0.26.0
  - @stackra/clients@0.26.0
  - @stackra/storage@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/market-packs@0.26.0
  - @stackra/support@0.26.0
  - @stackra/transport@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- fd0e4a9: `verifyZitadelSignature` is exported from `@stackra/identity`, beside `claimsActionResponse`. A service that answers the
  claims action (`IdpAdmin.installClaimsAction`) checks the `ZITADEL-Signature` header over the raw body with it before it
  reads the body, without copying the HMAC check.
- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/tenancy@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/scheduler@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/privacy@0.25.0
  - @stackra/scope@0.25.0
  - @stackra/clients@0.25.0
  - @stackra/query@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/storage@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/market-packs@0.25.0
  - @stackra/support@0.25.0
  - @stackra/transport@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/scope@0.24.0
  - @stackra/clients@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/scheduler@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/privacy@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/query@0.24.0
  - @stackra/storage@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/market-packs@0.24.0
  - @stackra/support@0.24.0
  - @stackra/transport@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Minor Changes

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
- f790fa1: A service now gets its own token from ZITADEL by itself, and sends it on every call to another service.
  
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

### Patch Changes

- c8998d9: Passkey sign-in (`passkey.challenge`, `passkey.verify`) is `Idempotency.Never`: a challenge is single-use and a
  verification answers session credentials, so neither is kept by the idempotency store or replayed.
- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
- Updated dependencies [dee48f0]
  - @stackra/database@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/ui@0.23.0
  - @stackra/clients@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/scheduler@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/privacy@0.23.0
  - @stackra/scope@0.23.0
  - @stackra/query@0.23.0
  - @stackra/storage@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/market-packs@0.23.0
  - @stackra/support@0.23.0
  - @stackra/transport@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/events@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/scheduler@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/privacy@0.22.0
  - @stackra/scope@0.22.0
  - @stackra/clients@0.22.0
  - @stackra/query@0.22.0
  - @stackra/storage@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/market-packs@0.22.0
  - @stackra/support@0.22.0
  - @stackra/transport@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Minor Changes

- 1073d9c: `IdpAdmin.installClaimsAction({ endpoint, timeoutSeconds? })` makes the provider add the Stackra claims to every
  token and userinfo answer. On ZITADEL it is an Actions v2 `restCall` target named `stackra-claims` that fails the token
  when the endpoint fails, plus the `preuserinfo` and `preaccesstoken` function executions. The first install answers the
  target's signing key once, and a later install repoints the target and answers none. `claimsActionResponse(claims)` is
  the endpoint's answer: `append_claims` for every `IDENTITY_CLAIMS` name, the realm included. `StackraClaims` types its
  input. The endpoint verifies each call with the existing `verifyZitadelSignature`.

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/database@0.21.0
  - @stackra/tenancy@0.21.0
  - @stackra/scheduler@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/clients@0.21.0
  - @stackra/storage@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/market-packs@0.21.0
  - @stackra/transport@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/queue@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/privacy@0.21.0
  - @stackra/scope@0.21.0
  - @stackra/query@0.21.0
  - @stackra/support@0.21.0

## 0.20.0

### Minor Changes

- cc87438: `actorOf(claims, principals)` turns a verified access token into the call's `Actor` (ADR 0209 decision 3,
  service-to-service calls). A token whose subject is a service account is the `service` actor of its principal, found
  through the new `ServicePrincipals` port (`bySubject`, answering a `ServicePrincipal`: a `svc_` id, the
  `<product>.<member>` key and the tenant), whatever other claims it carries. Any other token is a `user` actor read from
  `urn:stackra:user_id`, the new `urn:stackra:realm` claim (`IDENTITY_CLAIMS.realm`) and the membership matching the
  token's scope path. An unknown subject, a missing or mistyped claim, or a scope path outside the memberships is
  refused `unauthenticated`. `MemoryServicePrincipalsDriver` serves tests.

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/clients@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/scheduler@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/privacy@0.20.0
  - @stackra/scope@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/query@0.20.0
  - @stackra/storage@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/market-packs@0.20.0
  - @stackra/transport@0.20.0
  - @stackra/contracts@0.20.0
  - @stackra/support@0.20.0

## 0.19.0

### Minor Changes

- 58a8fa5: Every write action's permission is at least L2 (STA-2096, owner decision 2026-11-04). gen refuses an action whose
  permission is L0 or L1 with `action_risk_below_write`. Raised: `collaboration.room.publish`, `media.upload.create`,
  `data_maintenance.synonym.create` and `.update`, `analytics.analytics_batch.ingest`, `consent.consent_snapshot.issue`,
  `identity.passkey.challenge`, `loyalty_kit.loyalty_account.enroll` to L2;
  `segments.segment.recompute` and `privacy.subject.export` to L2 (system); `loyalty_kit.loyalty_account.redeem` and
  `.stamp` to L3 (a points balance); `loyalty_kit.loyalty_account.expire` to L3 (system); `panel.view.share` to L2;
  `identity.passkey.verify` (it mints a session) and `identity.passkey.confirm` (it keeps a new key) to L4;
  `webhooks.webhook_delivery.send` (an external send) and `access_log.access_log_entry.purge` (it deletes for good) to L4
  (system).
- 0da5f7a: Step-up works out of the box (STA-340). `@stackra/identity` ships `IdentityStepUpCheckDriver`, the `identity` driver of
  the actions pipeline's `StepUpCheck` (`requireAssurance` with `IdentityConfig.stepUpMaxAgeMinutes`; a call without
  assurance is refused). gen binds it by default in every service that declares `@stackra/identity`; a host without
  identity binds none and its step-up actions still fail closed. `@stackra/actions/testing` adds
  `MemoryStepUpCheckDriver`, picked by `.useDrivers("memory")`: a test passes `assurance` at the declared level to
  `run`, and a call without it is refused `step_up_required`.

### Patch Changes

- 0e0de4f: Gen refuses a misshapen call. `checkCallShape` runs once per action or query in the manifest pass and refuses a query
  whose permission is L2 or above (`query_above_l1`), a query with `preconditions` (`query_precondition`), an action with
  `cache` (`action_cache`), an L3 or L4 action a user can call with no `stepUp` (`step_up_missing`) and a client write,
  an action with an endpoint or a tool, with no written `idempotency` (`idempotency_missing`). Each refusal carries its
  fix. Write `idempotency: Idempotency.Optional` on a client write that is safe to repeat: it is the default the
  pipeline already applies, and it now also sets the tool's `idempotentHint`.
  
  The actions pipeline asks `StepUpCheck` only when the caller is a user. A service, job, system or agent call carries
  no assurance, so an action that both users and services call can declare `stepUp` and its service callers keep
  working; a user call with no `StepUpCheck` bound still fails closed (ADR 0406 as amended).
  
  `identity.operator.bootstrap`, `identity.session.end_user` and `privacy.hold.release` declare
  `stepUp: AssuranceLevel.Aal2`, so a user call to them now needs a bound `StepUpCheck`. The client writes of identity,
  privacy, access-log, loyalty-kit, data-maintenance, media and collaboration that declared no idempotency write
  `Idempotency.Optional`; their manifests gain the `idempotency` entry and `idempotentHint: true`.
- 0e0de4f: Step-up for the L3 and L4 user actions STA-2096 raised (STA-340):
  
  - `@stackra/actions`: `stepUp` also takes `{ exempt: "first-factor-enrolment" }`, for which the pipeline asks no
    `StepUpCheck`; the action enforces its own rule.
  - `@stackra/gen`: refuses the exemption on any action outside `FIRST_FACTOR_ENROLMENT_ACTIONS`
    (`step_up_exemption_unlisted`).
  - `@stackra/identity`: `identity.passkey.confirm` takes the exemption. A first strong factor needs a fresh sign-in;
    once the user has one, a new passkey needs AAL2. Each enrolment is audited with `firstFactor`.
  - `@stackra/loyalty-kit`: `points.redeem` and `points.confirm_redemption` need AAL2 from a user. `points.earn_visit` is
    service-only and loses its `POST /loyalty/visits` endpoint: call it from the till or booking service.
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [e5ac3d0]
- Updated dependencies [d2b3d22]
- Updated dependencies [eafb209]
- Updated dependencies [d22e767]
- Updated dependencies [e283a31]
- Updated dependencies [27f2b3f]
- Updated dependencies [15d8a1b]
- Updated dependencies [bc5a0ab]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/queue@0.19.0
  - @stackra/iam@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/privacy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/clients@0.19.0
  - @stackra/storage@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/market-packs@0.19.0
  - @stackra/transport@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0
  - @stackra/scheduler@0.19.0
  - @stackra/scope@0.19.0
  - @stackra/query@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- @stackra/scheduler@0.18.1
  - @stackra/privacy@0.18.1
  - @stackra/tenancy@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/clients@0.18.1
  - @stackra/query@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/storage@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/market-packs@0.18.1
  - @stackra/support@0.18.1
  - @stackra/transport@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1
  - @stackra/queue@0.18.1
  - @stackra/scope@0.18.1

## 0.18.0

### Patch Changes

- @stackra/scheduler@0.18.0
  - @stackra/privacy@0.18.0
  - @stackra/tenancy@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/clients@0.18.0
  - @stackra/query@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/storage@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/market-packs@0.18.0
  - @stackra/support@0.18.0
  - @stackra/transport@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0
  - @stackra/queue@0.18.0
  - @stackra/scope@0.18.0

## 0.17.2

### Patch Changes

- @stackra/scheduler@0.17.2
  - @stackra/privacy@0.17.2
  - @stackra/tenancy@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/clients@0.17.2
  - @stackra/query@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/storage@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/market-packs@0.17.2
  - @stackra/support@0.17.2
  - @stackra/transport@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2
  - @stackra/queue@0.17.2
  - @stackra/scope@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [0b917cf]
  - @stackra/market-packs@0.17.1
  - @stackra/iam@0.17.1
  - @stackra/query@0.17.1
  - @stackra/privacy@0.17.1
  - @stackra/clients@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/storage@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/support@0.17.1
  - @stackra/transport@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1
  - @stackra/queue@0.17.1
  - @stackra/scheduler@0.17.1
  - @stackra/scope@0.17.1
  - @stackra/tenancy@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/clients@0.17.0
  - @stackra/database@0.17.0
  - @stackra/storage@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/market-packs@0.17.0
  - @stackra/support@0.17.0
  - @stackra/transport@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/queue@0.17.0
  - @stackra/scheduler@0.17.0
  - @stackra/iam@0.17.0
  - @stackra/privacy@0.17.0
  - @stackra/scope@0.17.0
  - @stackra/tenancy@0.17.0
  - @stackra/query@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/scheduler@0.16.0
  - @stackra/query@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/clients@0.16.0
  - @stackra/database@0.16.0
  - @stackra/storage@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/market-packs@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/privacy@0.16.0
  - @stackra/scope@0.16.0
  - @stackra/tenancy@0.16.0
  - @stackra/transport@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/privacy@0.15.0
  - @stackra/scope@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/tenancy@0.15.0
  - @stackra/clients@0.15.0
  - @stackra/query@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/storage@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/market-packs@0.15.0
  - @stackra/support@0.15.0
  - @stackra/transport@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/queue@0.15.0
  - @stackra/scheduler@0.15.0

## 0.14.4

### Patch Changes

- @stackra/query@0.14.4
  - @stackra/privacy@0.14.4
  - @stackra/clients@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/storage@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/market-packs@0.14.4
  - @stackra/support@0.14.4
  - @stackra/transport@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4
  - @stackra/queue@0.14.4
  - @stackra/scheduler@0.14.4
  - @stackra/scope@0.14.4
  - @stackra/tenancy@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/clients@0.14.3
  - @stackra/database@0.14.3
  - @stackra/storage@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/market-packs@0.14.3
  - @stackra/support@0.14.3
  - @stackra/transport@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/queue@0.14.3
  - @stackra/scheduler@0.14.3
  - @stackra/iam@0.14.3
  - @stackra/privacy@0.14.3
  - @stackra/scope@0.14.3
  - @stackra/tenancy@0.14.3
  - @stackra/query@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/clients@0.14.2
  - @stackra/database@0.14.2
  - @stackra/storage@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/market-packs@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/scheduler@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/privacy@0.14.2
  - @stackra/scope@0.14.2
  - @stackra/tenancy@0.14.2
  - @stackra/query@0.14.2
  - @stackra/transport@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/clients@0.14.1
  - @stackra/database@0.14.1
  - @stackra/storage@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/market-packs@0.14.1
  - @stackra/support@0.14.1
  - @stackra/transport@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/queue@0.14.1
  - @stackra/scheduler@0.14.1
  - @stackra/iam@0.14.1
  - @stackra/privacy@0.14.1
  - @stackra/scope@0.14.1
  - @stackra/tenancy@0.14.1
  - @stackra/query@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/clients@0.14.0
  - @stackra/database@0.14.0
  - @stackra/storage@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/market-packs@0.14.0
  - @stackra/support@0.14.0
  - @stackra/transport@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/queue@0.14.0
  - @stackra/scheduler@0.14.0
  - @stackra/iam@0.14.0
  - @stackra/privacy@0.14.0
  - @stackra/scope@0.14.0
  - @stackra/tenancy@0.14.0
  - @stackra/query@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/clients@0.13.0
  - @stackra/database@0.13.0
  - @stackra/storage@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/market-packs@0.13.0
  - @stackra/support@0.13.0
  - @stackra/transport@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/queue@0.13.0
  - @stackra/scheduler@0.13.0
  - @stackra/iam@0.13.0
  - @stackra/privacy@0.13.0
  - @stackra/scope@0.13.0
  - @stackra/tenancy@0.13.0
  - @stackra/query@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/clients@0.12.0
  - @stackra/database@0.12.0
  - @stackra/storage@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/market-packs@0.12.0
  - @stackra/support@0.12.0
  - @stackra/transport@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/queue@0.12.0
  - @stackra/scheduler@0.12.0
  - @stackra/iam@0.12.0
  - @stackra/privacy@0.12.0
  - @stackra/scope@0.12.0
  - @stackra/tenancy@0.12.0
  - @stackra/query@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/clients@0.11.1
  - @stackra/database@0.11.1
  - @stackra/storage@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/market-packs@0.11.1
  - @stackra/support@0.11.1
  - @stackra/transport@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/queue@0.11.1
  - @stackra/scheduler@0.11.1
  - @stackra/iam@0.11.1
  - @stackra/privacy@0.11.1
  - @stackra/scope@0.11.1
  - @stackra/tenancy@0.11.1
  - @stackra/query@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/clients@0.11.0
  - @stackra/database@0.11.0
  - @stackra/storage@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/market-packs@0.11.0
  - @stackra/support@0.11.0
  - @stackra/transport@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/queue@0.11.0
  - @stackra/scheduler@0.11.0
  - @stackra/iam@0.11.0
  - @stackra/privacy@0.11.0
  - @stackra/scope@0.11.0
  - @stackra/tenancy@0.11.0
  - @stackra/query@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/scheduler@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/clients@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/market-packs@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/privacy@0.10.0
  - @stackra/scope@0.10.0
  - @stackra/tenancy@0.10.0
  - @stackra/query@0.10.0
  - @stackra/storage@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/transport@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0
  - @stackra/support@0.10.0

## 0.9.0

### Minor Changes

- 378f6a6: `DeviceSession` (the SecurityPage's signed-in session row, from the `AccountSecurity` port) is renamed `AccountSession`,
  so it no longer shares a name with `@stackra/native-spotlight`'s `DeviceSession`.

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [681d01a]
- Updated dependencies [2e43c48]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/clients@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/scheduler@0.9.0
  - @stackra/database@0.9.0
  - @stackra/queue@0.9.0
  - @stackra/tenancy@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/storage@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/market-packs@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/privacy@0.9.0
  - @stackra/scope@0.9.0
  - @stackra/query@0.9.0
  - @stackra/transport@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/scheduler@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/privacy@0.8.0
  - @stackra/scope@0.8.0
  - @stackra/tenancy@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/clients@0.8.0
  - @stackra/storage@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/market-packs@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/query@0.8.0
  - @stackra/transport@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

## 0.7.1

### Patch Changes

- @stackra/scheduler@0.7.1
  - @stackra/privacy@0.7.1
  - @stackra/tenancy@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/clients@0.7.1
  - @stackra/query@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/storage@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/market-packs@0.7.1
  - @stackra/support@0.7.1
  - @stackra/transport@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1
  - @stackra/queue@0.7.1
  - @stackra/scope@0.7.1

## 0.7.0

### Minor Changes

- 1f5bf76: `SignIn` on React Native, in `@stackra/identity/native`: the identity kit's sign-in card (ADR 0504) with the same props
  as the web block, so one login configuration drives both. It shows the tenant's providers, an email and password form
  whose return key submits, "remember me", the forgotten-password and sign-up links, and an announced error; every word
  comes from the host in `labels`. It signs nobody in itself: the host starts a provider through the Expo drivers. The
  showcase lists it for native as well as web.
- 1f5bf76: The identity kit's web blocks (ADR 0504) in `@stackra/identity/react`: `SessionGate` (shows content to a signed-in
  user at the assurance level asked for), `AccountMenu`, `StepUpDialog` (runs the existing `stepUpSignIn`),
  `PasswordPolicyChecklist`, `PasswordReset`, `SignUp` and `SecurityPage`. The new `AccountSecurity` client port in
  `./contracts` feeds the security page (passkeys, second factors, device sessions, password), with
  `MemoryAccountSecurityDriver` in `./testing`; a refused change opens the step-up dialog and retries. The session user
  now carries the `assurance` level its sign-in reached. Every word comes from the host in `labels`; the showcase lists
  the seven blocks under Blocks.

### Patch Changes

- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/tenancy@0.7.0
  - @stackra/clients@0.7.0
  - @stackra/privacy@0.7.0
  - @stackra/query@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/storage@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/market-packs@0.7.0
  - @stackra/support@0.7.0
  - @stackra/transport@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0
  - @stackra/queue@0.7.0
  - @stackra/scheduler@0.7.0
  - @stackra/scope@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/clients@0.6.1
  - @stackra/database@0.6.1
  - @stackra/storage@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/market-packs@0.6.1
  - @stackra/support@0.6.1
  - @stackra/transport@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/queue@0.6.1
  - @stackra/scheduler@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/privacy@0.6.1
  - @stackra/scope@0.6.1
  - @stackra/tenancy@0.6.1
  - @stackra/query@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [e250d4f]
- Updated dependencies [c64a55d]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/database@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/tenancy@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/scheduler@0.6.0
  - @stackra/privacy@0.6.0
  - @stackra/scope@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/clients@0.6.0
  - @stackra/storage@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/market-packs@0.6.0
  - @stackra/support@0.6.0
  - @stackra/transport@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/query@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/scheduler@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/privacy@0.5.1
  - @stackra/scope@0.5.1
  - @stackra/tenancy@0.5.1
  - @stackra/clients@0.5.1
  - @stackra/query@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/storage@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/market-packs@0.5.1
  - @stackra/support@0.5.1
  - @stackra/transport@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [104d9f4]
- Updated dependencies [d7f72d3]
  - @stackra/tenancy@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/clients@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/privacy@0.5.0
  - @stackra/query@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/storage@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/market-packs@0.5.0
  - @stackra/support@0.5.0
  - @stackra/transport@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0
  - @stackra/queue@0.5.0
  - @stackra/scheduler@0.5.0
  - @stackra/scope@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [8d29426]
- Updated dependencies [b970c98]
- Updated dependencies [58c7da9]
- Updated dependencies [1856ee0]
- Updated dependencies [dedaa81]
- Updated dependencies [a7eaed4]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/scope@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/tenancy@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/market-packs@0.4.0
  - @stackra/support@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/clients@0.4.0
  - @stackra/scheduler@0.4.0
  - @stackra/privacy@0.4.0
  - @stackra/query@0.4.0
  - @stackra/storage@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/transport@0.4.0

## 0.3.0

### Minor Changes

- 4a6abd7: Add the module UI kits (ADR 0504): each module's `./react` entry ships its domain blocks on `@stackra/ui`, every word
  and value in props. `@stackra/ai/react`: `ChatSurface`. `@stackra/pricing/react`: `PricingTable`.
  `@stackra/payments/react`: `Cart` and `Checkout`. `@stackra/identity/react`: `SignIn`. `@stackra/experience/react`:
  `FeatureSection` and `CtaSection`.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- 895a526: <!-- Purpose: release note for `optionalRequires`. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0025; STA-1722. -->
  
  `library({ optionalRequires })` rewrites a native entry's shimmed `__require("expo-…")` of a listed optional peer back
  to a literal `require` call, so Metro sees and bundles the peer; 0.2.0's `native.mjs` called it through the
  `__require` shim, which Metro never resolves, so haptics, clipboard, pickers, video and Apple sign-in stayed off. Any
  other `require` in a chunk fails the build.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [e6a582a]
- Updated dependencies [895a526]
- Updated dependencies [a60f4e9]
- Updated dependencies [a60f4e9]
- Updated dependencies [f05c8e5]
- Updated dependencies [a60f4e9]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/clients@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/market-packs@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/privacy@0.3.0
  - @stackra/query@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/scheduler@0.3.0
  - @stackra/scope@0.3.0
  - @stackra/storage@0.3.0
  - @stackra/support@0.3.0
  - @stackra/tenancy@0.3.0
  - @stackra/transport@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- a167045: Let a user delete their own account from inside the app (App Store Review Guideline 5.1.1(v), Google Play, STA-1567).
  `@stackra/identity/node` adds `DeleteMyAccountAction` (`identity.account_deletion.request@1`, step-up `aal2`, the
  caller's own account only), `CancelAccountDeletionAction`, `ShowAccountDeletionQuery`, the hourly system job
  `EraseDueAccountsAction` and `AccountDeletionPermissions`. A deletion waits `IdentityConfig.accountDeletionGraceDays`
  (30 by default) in the new `AccountDeletions` store (`PostgresAccountDeletionsDriver` over `identity.account_deletions`,
  migration `identity.0001`; `MemoryAccountDeletionsDriver`), then the per-scope job queues privacy's `EraseSubjectAction`
  unless a legal hold names the subject (a held one is pushed back a day); `SubjectErased` then ends the provider sessions and removes
  the provider user. Events `identity.account_deletion.{scheduled,cancelled,started}.v1`. Client halves:
  `useAccountDeletion` (`./react`) and `useAccountDeletionSheet` (`./native`, with the device check), with the
  `identity.ui.account_deletion` lang keys in seven locales (`./assets/*`). `@stackra/privacy/contracts` adds the
  `SubjectHolds` port and `./node` adds its `PostgresSubjectHoldsDriver`. New dependency of identity: `@stackra/database`.
- 48be198: Serve the BFF's sign-in from `./node`: `BffService` answers `GET login` (OIDC authorization code with PKCE, state,
  nonce and verifier sealed in a short-lived `__Host-` cookie), `GET callback` (state, code exchange and ID token checks,
  then the `HttpOnly; Secure; SameSite=Lax; Path=/` session cookie), `GET session` and `POST logout`, which ends the
  provider session server-side through `IdpAdmin.endSession`, clears the cookie and answers the provider's end-session
  URL. Return URLs are limited to `BffConfig.returnOrigins`. New `BffConfig` (key `bff`, with `BffOptions` and
  `BffConfig$`) holding the callback URL, return origins, cookie name and lifetimes, and the `IDENTITY_BFF_CLIENT_SECRET`
  and `IDENTITY_BFF_COOKIE_KEY` secrets by name (STA-1566). `BffService.sessionOf(request)` reads the session cookie for a
  host's raw endpoint that turns it into the call's actor, and `BffSessionStoreDriver.signOut` now leaves for the
  `redirectTo` the logout answers, so the provider's browser session ends too.
- 7487ba8: Add the session list and "sign out everywhere" (STA-1580). `IdpAdmin.listSessions(userId)` answers a user's live
  provider sessions as the new `IdpSession` (id, `createdAt`, `lastActiveAt`, the device's `userAgent`), through the v2
  session search in `ZitadelIdpAdminDriver` and in `MemoryIdpAdminDriver` (`openSession(userId, userAgent?)`).
  `@stackra/identity/node` adds `ListMySessionsQuery`, `EndMySessionAction` (refuses a session that is not the caller's
  as `NotFoundError`), `EndAllMySessionsAction` and the audited admin `EndUserSessionsAction`, with `SessionPermissions`
  (ADR 0462) and their schemas. A driver of `IdpAdmin` outside this package must add `listSessions`.
- d37c08f: Add Sign in with Apple (App Store guideline 4.8). `SocialProvider.Apple` is offered by `signInProvidersOf` in every
  market once `externalProviders.apple` names ZITADEL's Apple provider, and `externalSignIn("apple", …)` sends the hosted
  sign-in there. `./contracts` adds the `AppleSignIn` port with `AppleSignInRefusal`, `AppleCredential` and
  `AppleSignInResult`; `./native` adds `ExpoAppleSignInDriver`, which requires `expo-apple-authentication` (a new optional peer, `catalog:mobile`) on use and
  throws an error naming it when the app has not installed it. Labels ship in `assets/lang` in seven locales.
- f7ae148: Add `ZitadelAuthEventsService` (STA-1579): the receiver of a ZITADEL Actions v2 event target that verifies the
  `ZITADEL-Signature` HMAC over the raw body and writes sign-in, failed sign-in, second-factor, lockout and sign-out
  events into the audit hash chain through the `AuditTrail` port, mapped by the new `IdpAuthEvent` enum. Add
  `IdpAdminConfig.eventsSigningKey` (the `IDENTITY_IDP_EVENTS_SIGNING_KEY` secret).
- 5fa1a15: Add the operator bootstrap (STA-1586): `BootstrapOperatorAction` (`identity.operator.bootstrap@1`,
  `POST /platform/operators/bootstrap`) gives the user with an email a role (`owner` by default) at the platform node
  once, through `@stackra/iam/contracts`' `RoleGrants`, with `dryRun` and the `OperatorBootstrapOutcome` codes
  (`granted`, `already_granted`, `would_grant`, `not_found`). `OperatorPermissions.bootstrap` is L4 and system-held, so
  only a service principal acting for no one can call it. `IdpAdmin` gains the abstract `findStackraUserId(email)`
  (ZITADEL: a v2 user search on the email, then the `stackra_user_id` metadata; the memory driver keeps each user's
  email): a custom `IdpAdmin` driver must implement it.

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [b5141fe]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [a167045]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/privacy@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/transport@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/scope@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/query@0.2.0
  - @stackra/market-packs@0.2.0
  - @stackra/storage@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 8377336: Add the `IdpAdmin` port (users, machine users, ending sessions, the OAuth device flow, login policy) with
  `ZitadelIdpAdminDriver`, configured by `IdpAdminConfig` (the managed or own ZITADEL URL and the
  `IDENTITY_IDP_ADMIN_TOKEN` secret), and `MemoryIdpAdminDriver` (STA-834). Add API-key verification by hash: the
  `ApiKeyStore` port, `hashApiKey`, `ApiKeyVerifierService` and `MemoryApiKeyStoreDriver` (STA-835, ADR 0410).
- 1c230bd: `LoginPolicy` gains optional `externalProviderIds` and `secondFactors` (new `IdpSecondFactor` enum); the ZITADEL
  `IdpAdmin` driver brings an organisation's login-policy providers and second factors to exactly the listed ones, and the
  memory driver keeps a list a later policy leaves out. The infra-identity README names the `identity` machine's roles and
  its token as `IDENTITY_IDP_ADMIN_TOKEN`. STA-1263.
- 2787c1e: Add `@stackra/identity`: `IdentityConfig` with its shipped schema, `AuthFlow` and `SessionStatus`, the `SessionStore`
  port with the BFF cookie and PKCE drivers, `SessionService` with the session claims mapping (the scope claim is
  `@stackra/scope`'s `SCOPE_PATH_CLAIM`), which also keeps `@stackra/iam`'s permission snapshot, the `ClientSession` and
  memory `IdentityResolver` drivers, the `OfflineSession` driver through which a revoked session wipes and locks the
  offline stores of `@stackra/query`, `useSession` in `./react`, and `fakeSession` and `fakeIdentity` in `./testing`.
- 0006947: Add the server half of passkeys and end an erased subject's sessions (STA-1538, STA-1543). `IdpAdmin` gains
  `findUserId` (the provider user of a `usr_` id, kept as the `stackra_user_id` metadata `createUser` now writes from
  `IdpUserInput.stackraUserId`), `startPasskeySignIn` and `finishPasskeySignIn` (a ZITADEL v2 session with a `webAuthN`
  challenge and its check) and `startPasskeyRegistration` and `finishPasskeyRegistration` (the v2 user passkey
  endpoints); the ZITADEL and memory drivers implement them. A custom `IdpAdmin` driver must implement the five new
  methods. The new `./node` entry ships `ChallengePasskeyAction`, `VerifyPasskeyAction`, `RegisterPasskeyAction` and
  `ConfirmPasskeyAction` with `PasskeyPermissions` and their schemas, and `EndErasedSubjectSessionsListener`, which ends
  every provider session of the subject of @stackra/privacy's `SubjectErased` and then removes its provider user (it takes
  a `Logger` and warns when the provider has no user for the subject). `signInWithPasskey` and `registerPasskey`
  in `.` wire a `Passkeys` driver (`ExpoPasskeysDriver` on a phone) to those actions.
- 0f96a66: Add the `Passkeys` port (`./contracts`) for the device step of a passkey registration or sign-in against the identity
  provider, with `PasskeyRefusal` and the WebAuthn option and credential types; `MemoryPasskeysDriver` (`.`) for tests
  and web, and `ExpoPasskeysDriver` (`./native`) over `react-native-passkey` (iOS 15+, Android 9+), mapping its errors
  to refusals (STA-1538). New optional peer: `react-native-passkey`.
- e3be0c3: Add API-key last use (`ApiKeyRecord.lastUsedAt`, `ApiKeyStore.recordUse` with a no-op default, written by
  `ApiKeyVerifierService` when older than the new `IdentityConfig.apiKeyLastUsedSeconds`), `IdpAdmin.listAuthMethods`
  (enrolled methods as RFC 8176 `amr` codes, on the ZITADEL and memory drivers) for the security page's MFA enrolment
  list, and the `AutomationPrincipals` port with `MemoryAutomationPrincipalsDriver` so an automation runs as its own
  principal (ADR 0153 decision 2). STA-1264.
- 391f64d: Add step-up (`AssuranceLevel`, `assuranceOf`, `requireAssurance`, `stepUpSignIn`, `StepUpRequiredError`) and sign-in
  options on `SessionStore.signIn` and `SessionService.signIn`; external identity providers per market from the market
  pack (`signInProvidersOf`, `externalSignIn`); the `./native` (`ExpoSignInBrowserDriver`) and `./desktop`
  (`ElectronSignInBrowserDriver`) entries; staff PIN quick-switch and manager override (`StaffPinService`, the
  `StaffPinStore` port with storage and memory drivers); publishable, origin-bound API keys (`ApiKeyKind`, `mintApiKey`,
  `parseApiKey`, `checkPublishableKey`, `isOriginAllowed`); a guardian acting for a minor (`GuardianActingService`, the
  `Guardianship` port); and the KYC and KYB `Verification` port with `VerificationService`, which picks providers from
  market-pack data. `IdentityConfig` gains the settings these read.
- 2bf1a5d: `./testing` gains `runVerificationCase(driver, case)` with `VerificationCase` and `VerificationCaseResult`: the
  recorded-fixture harness for `Verification` drivers. It checks a driver's answer against the recorded status, reasons
  and provider reference and against the port's rules (supported kind, `verification_unavailable` on an outage, snake_case
  reasons, none when verified, a valid `checkedAt`, no subject fact echoed back). The KYC and KYB vendor drivers are OS
  integrations code (ADR 0443 decision 7) and run their recorded cases through it, marked certification pending until a
  sandbox run passes (owner decision D3, stackra-58, STA-1052).
- eb2628a: Add the login directory writer (ADR 0451, STA-752): `loginDirectoryPrefix`, `LoginDirectoryStore`, `LoginIdentifierKind`,
  `LoginIdentifier` and `LoginDirectoryKey` in `./contracts`; `LoginDirectoryWriterService`, `LoginDirectoryConfig` (with
  `LoginDirectoryConfig$` and `LoginDirectoryOptions`, key `login_directory`, secret `IDENTITY_LOGIN_DIRECTORY_KEY`) and
  `MemoryLoginDirectoryStoreDriver` in `.`.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- c7e6988: Add verification to the `ProviderResolver` capabilities (ADR 0376 decision 1 Note, STA-1282): `candidates` takes
  `pin` to keep one mode only, `VerificationUse` (`platform` or `tenant`) on `VerificationRequest`, the
  `VerificationCandidate` type and `VerificationService#verifyThrough`, which runs a platform check only through
  platform Connections and a tenant check through the tenant's own Connection first. `VerificationResult` gains `mode`.
- d19a3d5: The BFF session store sends the CSRF header on every credentialed call (STA-1385). New `IdentityConfig.csrfHeader`
  (default `x-stackra-csrf`, lower case), which must equal the API's `app.csrf.headerName`, so @stackra/app's
  `CsrfGuard` lets a cookie-bearing sign-out through.

### Patch Changes

- 51d83d1: `MemoryIdpAdminDriver.finishPasskeySignIn` now takes the device's credential as its second argument, as the
  `IdpAdmin` port declares, so a caller holding the memory driver passes the same arguments as against ZITADEL.
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [0a38324]
- Updated dependencies [6f2c1f7]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [0cfb47a]
- Updated dependencies [ca89a64]
- Updated dependencies [a7b4dd1]
- Updated dependencies [738ba15]
- Updated dependencies [dc490c0]
- Updated dependencies [0e7eb1f]
- Updated dependencies [e7a388a]
- Updated dependencies [2d7233c]
- Updated dependencies [2787c1e]
- Updated dependencies [6912039]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [376a093]
- Updated dependencies [93fa8f1]
- Updated dependencies [89548ea]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c3ff8a7]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/clients@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/privacy@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/query@0.1.0
  - @stackra/scope@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/support@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/transport@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
