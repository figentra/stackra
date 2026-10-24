# Plan: `@stackra/app` wave 3

**Spec**: `.agents/specs/sta-348-app/spec.md`

## Design

- `bootApp(wiring, { roots, env, overrides })` (`src/core/functions/`) is the one boot: for each `wiring.config` row it
  builds `override ?? provide` with `buildConfig(type, { env, secrets: envSecrets(env) })` and binds it under
  `provide`, binds `new AppWiring(wiring)`, calls `Container.create([wiring], { roots, overrides })`, and picks
  `container.get(ErrorReporter)` or `ConsoleErrorReporterDriver`.
- `AppSections` types the two wiring sections this package owns: `contexts` (keys, outermost first) and `messages`
  (gen's `loadMessages` for one locale). `messagesOf` fails loudly without the loader.
- `./server`: `createApp(root, { wiring })` boots with `process.env`, groups bindings by kind into `handlers.byKind`,
  tracks `handlers.run` calls for `drain()`, refuses with `AppDrainingError` (an `unavailable` refusal) once draining,
  and `close()` drains then `container.close()`. SIGTERM and SIGINT listeners are removed on close.
  `Controller = createKind("controller", ControllerBase)` typed `(options: ControllerOptions) => ControllerClass`.
- `./worker`: `createApp(wiring, options)` wraps React Router's `createRequestHandler(options.build)`; boots once per
  isolate from the first request's bindings (a rejected boot is forgotten); a throw is reported and answered with
  the crash page.
- `./browser`: `createApp` accepts a wiring or `{ wiring, routes }` (`"member" in input` tells them apart); `hydrate`
  runs `hydrateRoot(document, <StrictMode><ContainerProvider><NonceProvider><HydratedRouter/>…)` in `startTransition`;
  `mount` uses `createBrowserRouter`, or `createHashRouter` on an `app:` origin. `hydrateRoute` uses a one-route memory
  router (layout → `*` route), the instances as `handle`, and `Contexts` with the page locale's catalogues.
- `./native`: `createApp(root, { wiring })` calls `SplashScreen.preventAutoHideAsync()`; `Root` boots once in an
  effect, applies `I18nManager.forceRTL`, loads catalogues via `messagesOf`, renders `ContainerProvider` + `Contexts`,
  then hides the splash.
- `./electron`: `createApp(options)` boots with `process.env`; `start()` sets the CSP header, denies permissions,
  serves `app://` through `bundleFileUrl` (refuses other hosts and paths outside the renderer), registers the bridge
  handler on `BRIDGE_CHANNEL`, guards navigation and `window.open`, opens the hardened window and checks the feed
  when packaged.
- `./react`: `Contexts` reads `AppWiring` from the container and nests the registered components; `CONTEXT_REGISTRY`
  starts with `i18n` → `I18nMount`; `registerContext` refuses a second component for a key.

## Constitution check

- Boundaries: imports `@stackra/{contracts,container,config,errors,i18n,csp}` and the optional peers only; no app,
  service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; no new catalog entry.
- Naming: v3.1; `<name>.<kind>.ts`; one declaration per file; no `Module`/`Service`/`define*` here.
- Secrets: read by name from the runtime env inside `bootApp`; never logged.
- No parameter properties and no `#private` fields.
