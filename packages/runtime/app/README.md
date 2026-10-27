# @stackra/app

<!--
Stackra file contract:
Purpose: the reader guide of @stackra/app: `createApp` per runtime target, the generated entries, the shared boot,
         the client contexts, the server lifecycle (boot, drain, close), request guards, the signed edge-header guard,
         the route session and the desktop baseline.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0295 (decisions 7 to 9); ADR 0263; ADR 0260 (decision 4); ADR 0127 2026-10-24 note;
                    ADR 0457; ADR 0437 (decision 4: the signed edge headers).
-->

Stackra app runtime: `createApp` for each runtime target, returning that target's app object, the shared boot from the
generated wiring, the client `Contexts`, and the `Controller` kind for raw HTTP. Nobody writes `main.ts`: gen writes
`.stackra/entry/<target>.ts`, which calls `createApp` from the target's subpath (ADR 0295 decisions 7 and 8).

**Tier:** `tier:lib` (`packages/runtime/app`). Entries `.`, `./react`, `./server`, `./worker`, `./browser`, `./native`,
`./desktop`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/errors`,
`@stackra/i18n`, `@stackra/csp`, `@stackra/navigation` and `@stackra/identity` (its contracts); React, React Router, Electron, React Native and expo-splash-screen are optional
peers, each loaded only by the entry that needs it.

`Module`, `Service` and the `define*` functions are not here: they live in `@stackra/container` and
`@stackra/contracts` (ADR 0127 2026-10-24 note).

## What is here

| Symbol                                       | Entry       | Use                                                                                  |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `bootApp`                                    | `.`         | the boot every target shares: configs from the env, container, reporter              |
| `AppWiring`                                  | `.`         | the booted wiring as a container token                                               |
| `AppSections`, `BootOptions`, `BootedApp`    | `.`         | the wiring sections this package reads; boot's options and result                    |
| `RouteSession`                               | `.`         | `ctx.session` and `ctx.identity`, added to navigation's `RouteServices`              |
| `signEdgeRequest`                            | `.`         | the edge signature (HMAC-SHA256, base64url); the Worker signs, the guard recomputes  |
| `Contexts`                                   | `./react`   | the client contexts in graph order, with the locale and catalogues                   |
| `registerContext`                            | `./react`   | a client package names the component of its context key                              |
| `createApp`, `ServerApp`                     | `./server`  | `key`, `ready()`, `probe()`, `drain()`, `close()`, `handlers`; `/healthz`, `/readyz` |
| `Controller`                                 | `./server`  | `extends Controller({ path })`: a raw endpoint with `handle(request)`                |
| `RequestGuard`                               | `./server`  | a check every inbound request passes; `handlers.guard(request, container)` runs them |
| `AppDrainingError`                           | `./server`  | the 503 refusal a draining server answers                                            |
| `EdgeHeaderGuard`                            | `./server`  | the first server check: signed, fresh, unreplayed edge headers (ADR 0437)            |
| `EdgeSignatureInvalidError`                  | `./server`  | the 401 refusal for a missing, wrong, stale or replayed edge signature               |
| `MemoryEdgeSigningKeysDriver`                | `./server`  | the `memory` `EdgeSigningKeys` driver (tests, local runs)                            |
| `MemoryEdgeNonceStoreDriver`                 | `./server`  | the `memory` `EdgeNonceStore` driver (tests, a single instance)                      |
| `createApp`, `WorkerApp`, `WorkerRequest<E>` | `./worker`  | `fetch(request, env, ctx)` over the React Router server build                        |
| `createApp`, `BrowserApp`, `hydrateRoute`    | `./browser` | `mount(root)`, `hydrate({ nonce })`, `router`; one prerendered page                  |
| `createApp`, `NativeApp`                     | `./native`  | `Root`, which boots behind the splash                                                |
| `createApp`, `DesktopApp`, `BRIDGE_CHANNEL`  | `./desktop` | `start()`, `windows`: the hardened main process and its bridges                      |

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
with `AppDrainingError` and waits for those in flight; `close()` drains, then shuts the container down. With `boot`
(the generated `#stackra/boot`), `createApp` awaits it once the container is ready, with `DATABASE_URL` and a shutdown
signal; `close()` aborts that signal after the drain, which disconnects the bus and inbox and stops the relay. SIGTERM and
SIGINT close and exit 0, or report and exit 1 when shutdown fails.

### Request guards

`RequestGuard` is an extension point built on the container's multi-binding (`getAll`, ADR 0457): a module binds a
subclass with `check(request)`, which throws a refusal to stop the request, and an optional `order` (lowest first,
default 0, wiring order within an order). The generated adapter calls `handlers.guard(request, container)` inside
`handlers.run`; it rejects with the first refusal and runs no later guard.

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
`EdgeNonceStore.claim(requestId)` wins (a replay loses). The nonce is claimed only after the signature holds. An
unsigned request passes only on one of `publicPaths` (none by default) and only with no identity header.

The key provider and the nonce store are ports, so which one answers is configuration: the `memory` drivers ship for
tests and local runs; production binds a secret-store key driver and, with more than one API instance, a shared
nonce store. `maxAge` and `publicPaths` are getters a host overrides in `src/overrides/app/` (ADR 0306).

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
