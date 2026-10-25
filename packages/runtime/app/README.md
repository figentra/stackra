# @stackra/app

Stackra app runtime: `createApp` for each runtime target, returning that target's app object, the shared boot from the
generated wiring, the client `Contexts`, and the `Controller` kind for raw HTTP. Nobody writes `main.ts`: gen writes
`.stackra/entry/<target>.ts`, which calls `createApp` from the target's subpath (ADR 0295 decisions 7 and 8).

**Tier:** `tier:lib` (`packages/runtime/app`). Entries `.`, `./react`, `./server`, `./worker`, `./browser`, `./native`,
`./desktop`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/errors`,
`@stackra/i18n` and `@stackra/csp`; React, React Router, Electron, React Native and expo-splash-screen are optional
peers, each loaded only by the entry that needs it.

`Module`, `Service` and the `define*` functions are not here: they live in `@stackra/container` and
`@stackra/contracts` (ADR 0127 2026-10-24 note).

## What is here

| Symbol                                       | Entry       | Use                                                                                  |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `bootApp`                                    | `.`         | the boot every target shares: configs from the env, container, reporter              |
| `AppWiring`                                  | `.`         | the booted wiring as a container token                                               |
| `AppSections`, `BootOptions`, `BootedApp`    | `.`         | the wiring sections this package reads; boot's options and result                    |
| `Contexts`                                   | `./react`   | the client contexts in graph order, with the locale and catalogues                   |
| `registerContext`                            | `./react`   | a client package names the component of its context key                              |
| `createApp`, `ServerApp`                     | `./server`  | `key`, `ready()`, `probe()`, `drain()`, `close()`, `handlers`; `/healthz`, `/readyz` |
| `Controller`                                 | `./server`  | `extends Controller({ path })`: a raw endpoint with `handle(request)`                |
| `AppDrainingError`                           | `./server`  | the 503 refusal a draining server answers                                            |
| `createApp`, `WorkerApp`, `WorkerRequest<E>` | `./worker`  | `fetch(request, env, ctx)` over the React Router server build                        |
| `createApp`, `BrowserApp`, `hydrateRoute`    | `./browser` | `mount(root)`, `hydrate({ nonce })`, `router`; one prerendered page                  |
| `createApp`, `NativeApp`                     | `./native`  | `Root`, which boots behind the splash                                                |
| `createApp`, `DesktopApp`, `BRIDGE_CHANNEL`  | `./desktop` | `start()`, `windows`: the hardened main process and its bridges                      |

## The generated entries

```ts
// services/commerce/.stackra/entry/server.ts
export const app = await createApp(CommerceModule, { wiring });

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
with `AppDrainingError` and waits for those in flight; `close()` drains, then shuts the container down. SIGTERM and
SIGINT close and exit 0, or report and exit 1 when shutdown fails.

## Desktop

The baseline is not configurable: context isolation, sandbox, no node integration, web security, no webview, the CSP
header from `CspConfig`, permissions denied, navigation only to `bridgeSenders`, every `window.open` denied (an
`https:` one opens in the system browser). The renderer is served as `app://bundle/` and never outside its folder. A
bridge call travels on `BRIDGE_CHANNEL` with the bridge's class name and is answered only from a trusted frame and
only for a class the wiring binds with kind `bridge`.
