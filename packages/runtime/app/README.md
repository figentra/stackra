# @stackra/app

<!--
Stackra file contract:
Purpose: the reader guide of @stackra/app: `createApp` per runtime target, the generated entries, the shared boot,
         the client contexts, the server lifecycle (boot, drain, close), request guards, the signed edge-header guard,
         the origin and CSRF guards with CORS, the JWKS bearer-token guard and when to use the edge Worker instead, the route session and the desktop baseline.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0295 (decisions 7 to 9); ADR 0263; ADR 0260 (decision 4); ADR 0127 2026-10-24 note;
                    ADR 0457; ADR 0437 (decisions 4 and 8: the signed edge headers, origin and CSRF); ADR 0206 (decision 8: JWKS).
-->

Stackra app runtime: `createApp` for each runtime target, returning that target's app object, the shared boot from the
generated wiring, the client `Contexts`, and the `Controller` kind for raw HTTP. Nobody writes `main.ts`: gen writes
`.stackra/entry/<target>.ts`, which calls `createApp` from the target's subpath (ADR 0295 decisions 7 and 8).

**Tier:** `tier:lib` (`packages/runtime/app`). Entries `.`, `./react`, `./server`, `./worker`, `./browser`, `./native`,
`./desktop`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/errors`,
`@stackra/i18n`, `@stackra/csp`, `@stackra/navigation`, `@stackra/identity` (its contracts), `@stackra/validation` and
zod (the CORS and CSRF configuration schemas); React, React Router, Electron, React Native and expo-splash-screen are optional
peers, each loaded only by the entry that needs it.

`Module`, `Service` and the `define*` functions are not here: they live in `@stackra/container` and
`@stackra/contracts` (ADR 0127 2026-10-24 note).

## What is here

| Symbol                                       | Entry       | Use                                                                                   |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `bootApp`                                    | `.`         | the boot every target shares: configs from the env, container, reporter               |
| `AppWiring`                                  | `.`         | the booted wiring as a container token                                                |
| `AppSections`, `BootOptions`, `BootedApp`    | `.`         | the wiring sections this package reads; boot's options and result                     |
| `RouteSession`                               | `.`         | `ctx.session` and `ctx.identity`, added to navigation's `RouteServices`               |
| `signEdgeRequest`                            | `.`         | the edge signature (HMAC-SHA256, base64url); the Worker signs, the guard recomputes   |
| `verifyBearerToken`, `jwksKeySource`         | `.`         | Web Crypto JWT check (RS256, ES256) and an issuer's cached keys; Worker and API share |
| `Contexts`                                   | `./react`   | the client contexts in graph order, with the locale and catalogues                    |
| `registerContext`                            | `./react`   | a client package names the component of its context key                               |
| `createApp`, `ServerApp`                     | `./server`  | `key`, `ready()`, `probe()`, `drain()`, `close()`, `handlers`; `/healthz`, `/readyz`  |
| `Controller`                                 | `./server`  | `extends Controller({ path })`: a raw endpoint with `handle(request)`                 |
| `RequestGuard`                               | `./server`  | a check every inbound request passes; `handlers.guard(request, container)` runs them  |
| `serveGuardedCall`, `HttpConfig`             | `./server`  | the one path of every generated HTTP adapter: capped body (413), guards over the exact bytes, `CallAuthenticator`, input, pipeline; `app.http` `maxBodyBytes` (1 MiB), `drainTimeoutSeconds` (20) and the load-shedding `maxConcurrentCalls` (1024), `maxQueuedCalls` (1024), `maxQueueWaitMs` (5000); a body slower than `bodyReadTimeoutMs` (30000) is 408 |
| `nodeBodyStream`                             | `./server`  | a Node or Encore raw request's body as a web stream, with backpressure; `Readable.toWeb` crashes on Encore's `RawRequest` (STA-2794) |
| `AppDrainingError`                           | `./server`  | the 503 refusal a draining server answers                                             |
| `AppOverloadedError`                         | `./server`  | the 503 refusal (`Retry-After: 1`) a server at capacity sheds a call with (STA-1467)  |
| `DrainTimeoutError`                          | `./server`  | reported (never thrown) when the drain deadline passes with calls still in flight     |
| `EdgeHeaderGuard`                            | `./server`  | the first server check: signed, fresh, unreplayed edge headers (ADR 0437)             |
| `EdgeSignatureInvalidError`                  | `./server`  | the 401 refusal for a missing, wrong, stale or replayed edge signature                |
| `MemoryEdgeSigningKeysDriver`                | `./server`  | the `memory` `EdgeSigningKeys` driver (tests, local runs)                             |
| `MemoryEdgeNonceStoreDriver`                 | `./server`  | the `memory` `EdgeNonceStore` driver (tests, a single instance)                       |
| `SecretsEdgeSigningKeysDriver`               | `./server`  | the `secrets` `EdgeSigningKeys` driver (the bound secret store, read on every check)  |
| `CacheEdgeNonceStoreDriver`                  | `./server`  | the `cache` `EdgeNonceStore` driver (every instance, over `Cache.add`)                |
| `OriginGuard`                                | `./server`  | the second server check: a state-changing request only from an allowed origin         |
| `CsrfGuard`                                  | `./server`  | the third server check: the CSRF header on a cookie-authenticated state change        |
| `BearerTokenGuard`                           | `./server`  | authentication without the edge: a JWKS-verified `Authorization: Bearer` JWT          |
| `VerifiedToken`                              | `./server`  | the request's verified token claims (`Lifetime.Request`), for the checks after it     |
| `BearerConfig`                               | `./server`  | `app.bearer`: issuer, audience, leeway, key-set cache time                            |
| `BearerTokenInvalidError`                    | `./server`  | the 401 refusal for a missing or invalid bearer token                                 |
| `OidcJsonWebKeysDriver`                      | `./server`  | the `oidc` `JsonWebKeys` driver: discovery, key set, cache, refetch on unknown kid    |
| `MemoryJsonWebKeysDriver`                    | `./server`  | the `memory` `JsonWebKeys` driver (tests, local runs)                                 |
| `ServiceClientSessionDriver`                 | `./server`  | the `service` `ClientSession`: a service call's own token and the user's it forwards  |
| `OriginNotAllowedError`                      | `./server`  | the 403 refusal for a foreign origin, or a cookie with no origin                      |
| `CsrfTokenInvalidError`                      | `./server`  | the 403 refusal for a missing or mismatched CSRF header                               |
| `CorsConfig`, `CsrfConfig`                   | `./server`  | `app.cors` (origins, methods, headers, credentials, max-age) and `app.csrf`           |
| `corsHeaders`                                | `./server`  | the CORS answer headers for a request, preflight included                             |
| `apiCacheControl`                            | `./server`  | `private, no-store` for a signed-in request or a cookie-setting answer (rule 22)      |
| `createApp`, `WorkerApp`, `WorkerRequest<E>` | `./worker`  | `fetch(request, env, ctx)` over the React Router server build                         |
| `createApp`, `BrowserApp`, `hydrateRoute`    | `./browser` | `mount(root)`, `hydrate({ nonce })`, `router`; one prerendered page                   |
| `createApp`, `NativeApp`                     | `./native`  | `Root`, which boots behind the splash                                                 |
| `createApp`, `DesktopApp`, `BRIDGE_CHANNEL`  | `./desktop` | `start()`, `windows`: the hardened main process and its bridges                       |

## The generated entries

```ts
// services/commerce/.stackra/entry/server.ts
export const app = await createApp(CommerceModule, { wiring, boot });

// apps/web/.stackra/entry/worker.ts
export const app = await createApp(wiring, {
  env: serverEnv,
  build,
  context: routerContext,
  crashPage,
});

// apps/web/.stackra/entry/browser.ts
export const app = await createApp(wiring);
app.hydrate({ nonce });

// apps/console/.stackra/entry/browser.ts
export const app = await createApp({ wiring, routes });
app.mount(root);

// apps/mobile/.stackra/entry/native.ts
export const app = createApp(MobileModule, { wiring });
registerRootComponent(app.Root);
```

## Boot

`bootApp` builds every configuration class of the wiring from the target's raw environment (`process.env`, a Worker's
bindings, `import.meta.env`), resolves `@Secret` fields by name from the same source, and binds each instance under
its base class, so a package that injects its base gets the host's override. A value that breaks its rule fails boot
with `ConfigInvalidError` naming it; a port with no driver fails with `UnresolvedPortError`. The reporter is the bound
`ErrorReporter`, or the console when none is bound.

The server `createApp` builds the configuration with `STACKRA_ENVIRONMENT` set to the running environment from the one
reader (`readEnvironment` of `@stackra/config`), given what the platform reported. A service's generated
`stackra-encore/<member>/environment.ts` hands Encore's `appMeta().environment` to `providePlatformEnvironment` before
any other generated file loads the app, so a deployed Encore service (which cannot set the variable) runs as
`preview`, `staging` or `production`, never `dev`; `dev` or `test` declared on a deployment, a misspelt name, or a
self-hosted image that reports nothing fails the process at boot (STA-2844).

## Wiring sections

`Wiring` is open for sections their package owns. This package reads two:

- `contexts`: the context keys `Contexts` mounts, outermost first. Without it, the module keys of the graph that have a
  registered context are mounted, in graph order. A named key with no registered component throws.
- `messages`: gen's `loadMessages` for one locale. Native and `hydrateRoute` load their catalogues through it; the web
  and router roots load theirs in the root loader.

## Contexts

A client package registers its context once, when its `react` or `native` entry loads:

```ts
registerContext("theming", ThemeProvider);
```

Each component gets `{ locale, messages, setLocale?, children }` and reads its configuration from the container
(`useConfig`). The `i18n` context is built in. The route tree's root mounts `Contexts` (the web `root.tsx`, the router
root); native `Root` and `hydrateRoute` mount it themselves.

## Server

`handlers.run(call)` gives one call a request container and counts it until it settles. `drain()` refuses new calls
with `AppDrainingError` and waits for those in flight, for at most `app.http` `drainTimeoutSeconds` (20 by default):
at that deadline it reports one `DrainTimeoutError` with the count still running and resolves, so a hung call cannot
keep the shutdown hooks (the outbox flush among them) from running before the platform's SIGKILL. `close()` drains,
then shuts the container down. With `boot`
(the generated `#stackra/boot`), `createApp` awaits it once the container is ready, with a shutdown signal; the boot
connects with its service's Encore database url, so `createApp` passes no url and never reads `DATABASE_URL`. The migrate
and seed CLIs connect on their own with `directDatabaseUrl()` of `@stackra/database/node` (`DATABASE_DIRECT_URL`, else
`DATABASE_URL`, ADR 0473). `close()` aborts that signal after the drain, which disconnects the bus and inbox and stops
the relay. SIGTERM and
SIGINT close and exit 0, or report and exit 1 when shutdown fails.

### Load shedding

Every call through `handlers.run` (HTTP, a Pub/Sub delivery, a queue job) passes one `Bulkhead` sized by
`app.http`: at most `maxConcurrentCalls` (1024) run at once, the next `maxQueuedCalls` (1024) wait in arrival order for
at most `maxQueueWaitMs` (5000), and every other call is refused with `AppOverloadedError` before its request container
exists, so an overload answers fast instead of piling up until the process stalls. Each shed call is counted on the
bound `Metrics` as `app.calls.shed` (`reason: overloaded`). The generated HTTP adapter answers it through
`handlers.shed(request, error)`: 503 with the refusal's envelope, `Retry-After: 1`, `Cache-Control: no-store` and the
CORS headers, and a draining refusal the same way without a wait. A shed Pub/Sub delivery or queue job is retried by
its transport. A cron run is never shed: Encore does not retry a failed CronJob invocation and `SchedulerService.fire`
moves no watermark, so the generated cron adapter calls `handlers.run(call, { shed: false })`, which skips the
bulkhead (the run is still counted in flight and still refused while draining). A queued call counts as in flight, so
a drain waits for it. `maxConcurrentCalls: 0` turns shedding off.
An HTTP call reads its body while it holds its place, so the body must arrive within `bodyReadTimeoutMs` (30000): a
slower upload is answered 408 (`request_timeout`, retryable, `Connection: close`) before any guard runs, so a handful
of slow-loris clients can never fill the bulkhead for long. `bodyReadTimeoutMs: 0` turns the deadline off; keep a
body timeout at the gateway then.
`/healthz` and `/readyz` never pass the bulkhead, so an overloaded instance stays live and ready.

```ts
export class HttpConfig extends BaseHttpConfig {
  override maxConcurrentCalls = 256;
  override maxQueueWaitMs = 2000;
}
```

### Readiness

`GET /readyz` runs every `HealthIndicator` the container binds (the health drivers of `@stackra/database`,
`cache`, `queue`, `realtime`, `filesystem` and `search`, and the infra packages' drivers) plus the `health` given to
`createApp`, each capped at three seconds. It answers 200 when none is `down` and 503 otherwise, with each indicator's
status by name, so the body says which dependency failed (`{ "database": "down", "cache": "up" }`); an indicator's
detail is never in the body. A dependency marked `health.critical: false` in its package config reports `degraded`,
which stays ready. A deploy check that reads `/readyz` (runway's `verify`) therefore fails a deploy whose critical
dependency does not answer; pointing `verify` at it is runway's side, not this package's.

### Request guards

`RequestGuard` is an extension point built on the container's multi-binding (`getAll`, ADR 0457): a module binds a
subclass with `check(request)`, which throws a refusal to stop the request, and an optional `order` (lowest first,
default 0, wiring order within an order). The generated adapter calls `handlers.guard(request, container)` inside
`handlers.run`; it rejects with the first refusal and runs no later guard.

When a `Tracer` is bound, `handlers.run` runs each call inside `Tracer.continueTrace` with an empty carrier, and
`handlers.guard` fills it once every guard passed: the request's `traceparent` and its `x-figentra-request-id`
(`EdgeHeader.RequestId`). The call's spans then join the caller's trace and carry `requestId` (ADR 0184, STA-1572).

```ts
export class EdgeSignatureGuard extends RequestGuard {
  override get order() { return -100; }
  async check(request: Request) { ... }
}
```

### The signed edge headers

The edge Worker forwards `EdgeHeader.Scope` (`x-figentra-tenant`; absent on a platform host), `Product`, `Surface`,
`Realm`, `RequestId`, `Timestamp` and `Signature` (ADR 0437 decision 4). `signEdgeRequest(input, secret)` (`.`) fixes
the signed bytes once: the `EdgeSignatureInput` fields joined by newlines (scope, product, surface, realm, request id,
timestamp, method, path with query, SHA-256 of the body in hex), HMAC-SHA256, base64url. The Worker imports it, so the
two sides cannot drift.

`EdgeHeaderGuard` is the first `RequestGuard` (order -100, ADR 0437 decision 8). It refuses with
`EdgeSignatureInvalidError` (401) unless the signature matches one of the keys `EdgeSigningKeys` answers (newest
first; two during a rotation, every key tried), the timestamp is within `maxAge` (60 seconds) of now either side, and
`EdgeNonceStore.claim(requestId)` wins (a replay loses). The nonce is claimed only after the signature holds. Any
edge header (an identity header, the signature, the request id or the timestamp) means the request must verify; a
request with none is not edge traffic (a service call, a cross-app delivery, a webhook), so it goes on to
authentication or its endpoint's own signature check. Gen binds the guard in every service.

The key provider and the nonce store are ports chosen by `EdgeConfig` (`app.edge`). `keys` is `memory` (tests, local
runs; empty, so every signed request is refused), `env`, which reads the secret `STACKRA_EDGE_SIGNING_KEYS` once at
boot (the edge Worker's signing keys, newest first, comma-separated), or `secrets`, which reads the same secret (or the
one `signingKeysSecret` names) from the bound `SecretStore` on every check. Every shipped target's `bootApp` binds the
environment the process started with as that store, not the wiring's `secrets.store` driver, and nothing reloads it,
so today `secrets` answers the same keys as `env` and a key rotation (ADR 0437 decision 4) still needs each API
instance restarted after the new key is listed first: list both keys, restart every instance, then switch the Worker
to the new key. A reloading boot store is STA-2804. `nonces` is `memory` (one instance: a replay is refused only where it was first seen) or
`cache`, which claims each request id with `Cache.add`, the cache's atomic set-if-absent, so every instance that
shares a `valkey` or `postgres` cache refuses a replay. A region with more than one API instance sets `nonces: cache`
and a shared cache driver before its edge goes live:

```yaml
# runway.yaml (production)
config:
  app: { edge: { keys: env, nonces: cache } }
  cache: { driver: valkey }
```

`maxAge` is a getter a host overrides in `src/overrides/app/` (ADR 0306).

### Bearer tokens (JWKS)

`BearerTokenGuard` (order -50, after rate limits and before tenant state, ADR 0437 decision 8) lets a request through
only with `Authorization: Bearer <jwt>` that `verifyBearerToken` accepts: RS256 or ES256 (Web Crypto; `none`, HS* and
a key whose type does not fit are refused), `iss` equal to `BearerConfig.issuer`, `aud` naming `BearerConfig.audience`,
`exp` and `nbf` within `leewaySeconds` (60). The keys come from the bound `JsonWebKeys` port: the `oidc` driver reads
the issuer's discovery document and key set, caches it for `keysSeconds` (3600) and refetches once on an unknown `kid`
(at most every 30 seconds). A request with no token passes only on one of `publicPaths` (a getter, none by default);
any failure is `BearerTokenInvalidError` (401, no detail). An issuer that cannot be reached throws its own error.

The verified claims go on the request's `VerifiedToken` (`Lifetime.Request`, so one per `container.forRequest()`);
the scope claim step, assurance and the actor read `verified.claims` from there. Configure it with
`STACKRA_BEARER_ISSUER` and `STACKRA_BEARER_AUDIENCE` (or runway) and bind the guard, `VerifiedToken` and a
`JsonWebKeys` driver in the service's wiring; gen does not bind them by default. ZITADEL issues opaque access tokens
unless the app's token type is JWT; set it to JWT.

### Service-to-service calls

A service calls another through its generated client, whose HTTP transport asks the `ClientSession` for headers. In a
service that session is `ServiceClientSessionDriver` (`service`): it sends `Authorization: Bearer` with the service's
own token from `ServiceTokens` (`@stackra/identity`), issued for the producer's project
(`ClientsConfig.audiences[<module>]`), and, when the running call holds one, the user's access token in
`Stackra-On-Behalf-Of`. `serveGuardedCall`, the one path of every generated endpoint and controller, runs the call
with that token held: the inbound user's bearer on a user's own call (the first hop), or the token a service forwarded
for its user only when the endpoint's action declares `onBehalfOf: { secondHop: true }`. A hand-written controller
names no action, so it forwards a first hop's bearer only, never a forwarded token. Otherwise nothing is held and the next service runs the call as the calling
service alone (ADR 0209, amendment of 2026-11-07). The held token lives only in the call's async context, never on the
actor, the context, a log, an error or an event, and is emptied when the call ends.

Gen binds this by default in a service that declares `@stackra/app`, `@stackra/clients` and `@stackra/identity`:
`ClientSession` takes `service` and `ServiceTokens` takes `zitadel` (`ZitadelServiceTokensDriver`), so no host wiring
is needed. A deployment sets `identity.service_tokens.issuer`, the secret named by
`identity.service_tokens.keySecret` (by default `IDENTITY_SERVICE_ACCOUNT_KEY`, the service account's ZITADEL key
file) and `clients.audiences`. A producer module with no audience fails the call with a `TypeError` naming the module,
before any token is asked for; nothing is ever sent unauthenticated.

### Edge Worker or in-process guard

| Your API runs…                                    | Use                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| behind the edge Worker (`workers/edge`, ADR 0437) | `EdgeHeaderGuard` with the Worker's signing key; add `BearerTokenGuard` to authenticate the user |
| on its own (a product outside OS, no Worker)      | `BearerTokenGuard` alone; there are no edge headers to check                                     |

The Worker resolves the host, refuses a bad JWT early with the same `verifyBearerToken`, strips inbound edge headers
and signs the forwarded request; it never authorises and forwards `Authorization` untouched, so the API still
verifies the token. Behind the Worker, `EdgeHeaderGuard` proves the request came through it (host, tenant, realm);
`BearerTokenGuard` proves who the user is. Without the Worker, nothing vouches for the host, so do not bind
`EdgeHeaderGuard` (it would refuse everything) and keep tenant and realm from the token's claims.

### Origin, CSRF and CORS

Three settings-driven pieces protect the BFF cookie session (gap analysis P0, STA-1374). All values are
configuration; a host overrides `CorsConfig` or `CsrfConfig` in `src/overrides/app/`.

| Config       | Field              | Default                                         | Use                                            |
| ------------ | ------------------ | ----------------------------------------------- | ---------------------------------------------- |
| `CorsConfig` | `allowedOrigins`   | `[]` (env `STACKRA_CORS_ALLOWED_ORIGINS`, JSON) | exact app origins, no wildcard                 |
| `CorsConfig` | `allowedMethods`   | `GET HEAD POST PUT PATCH DELETE`                | a preflight's `Access-Control-Allow-Methods`   |
| `CorsConfig` | `allowedHeaders`   | `content-type authorization x-stackra-csrf`     | a preflight's `Access-Control-Allow-Headers`   |
| `CorsConfig` | `allowCredentials` | `true`                                          | the BFF cookie travels                         |
| `CorsConfig` | `maxAgeSeconds`    | `600`                                           | preflight cache                                |
| `CsrfConfig` | `protectedMethods` | `POST PUT PATCH DELETE`                         | what both guards check                         |
| `CsrfConfig` | `headerName`       | `x-stackra-csrf`                                | the header a cookie-authenticated call carries |
| `CsrfConfig` | `tokenCookie`      | `""` (custom-header mode)                       | set it to turn on double-submit                |

- `OriginGuard` (order -90) lets a protected request through only from the API's own origin or `allowedOrigins`,
  read from `Origin`, else `Referer`. With neither header it passes a cookieless call (server to server, API key)
  and refuses one with a cookie. Refusal: `OriginNotAllowedError` (403).
- `CsrfGuard` (order -80) checks protected requests that carry a cookie. Custom-header mode, the default, fits the
  cross-origin BFF (the app cannot read the API origin's cookie): the header must be non-empty, and a page on
  another origin cannot send it without a preflight that CORS refuses. Double-submit mode (`tokenCookie` set, for a
  same-origin deployment) needs the header to equal that cookie, compared in constant time. Refusal:
  `CsrfTokenInvalidError` (403).
- `corsHeaders(request, cors)` returns the answer headers: an allowed origin is echoed (with credentials when on),
  and a preflight also gets the methods, headers and max-age. Anything else gets only `Vary: Origin`. The adapter
  answers `OPTIONS` preflights with 204 and these headers and adds them to every other answer.
- `apiCacheControl(request, response)` is ADR 0325 rule 22: an answer to a request with an `Authorization` header or
  any cookie, or an answer that sets a cookie, is `private, no-store`, over whatever the handler set. The generated
  adapter (`answerHttp`) sets it on every answer. Any cookie counts as signed in until rule 23's cache profiles name
  the cacheable public endpoints (stackra-299).

The client sends `x-stackra-csrf` on every `credentials: "include"` call. Not wired yet: the generated adapter calling
`corsHeaders` on preflight and answers (gen), and the BFF transport sending the header (`@stackra/identity`).

### The tenant on a call and its rate limit

The generated adapter that turns a verified request into `CallOptions` is not in this package yet; until it lands, the
tenant reaching `CallOptions.actor.scopeId` from the edge is assumed, not confirmed. Once it
is there, `@stackra/actions` keys the area's token bucket by it and sizes it from the bound `RateLimitBudget` (the
plan's value entitlement), so this package carries no rate-limit code of its own.

## The session on a route

`RouteSession` adds two members to every route context: `ctx.session` (the signed-in `SessionUser`, or null) and
`ctx.identity` (the bound `SessionStore`: sign in, sign out, the access token), so a layout gates on a session:

```ts
export class ShellLayout extends Layout({ targets: [Target.Web] }) {
  override loader(ctx: RouteContext<this>) {
    if (!ctx.session) return ctx.redirect(Routes.sign_in, { search: { returnTo: ctx.path } });
    return null;
  }
}
```

The Worker loads the session into each request container before the member's context factory runs, so the factory
must hand the routes that container. The browser and native targets load it once at boot (the web's sign-in and
sign-out leave the page). No bound `SessionStore`, or a refusal from it, is signed out.

## Desktop

The baseline is not configurable: context isolation, sandbox, no node integration, web security, no webview, the CSP
header from `CspConfig`, permissions denied, navigation only to `bridgeSenders`, every `window.open` denied (an
`https:` one opens in the system browser). The renderer is served as `app://bundle/` and never outside its folder. A
bridge call travels on `BRIDGE_CHANNEL` with the bridge's class name and is answered only from a trusted frame and
only for a class the wiring binds with kind `bridge`.
