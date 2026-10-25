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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/app`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/csp`, `@stackra/errors`, `@stackra/i18n` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | values are read by name from the runtime env inside `bootApp` and never logged                                                                                                                                              |
| Security                              | PASS   | the Electron window denies permissions, sets the CSP header and serves only `app://` paths inside the renderer                                                                                                              |
| HTTP and events                       | N/A    | no action or event; `Controller` is a kind base and this package declares no endpoint                                                                                                                                       |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                              |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                      |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                             |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                     |

- Boundaries: imports `@stackra/{contracts,container,config,errors,i18n,csp}` and the optional peers only; no app,
  service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; no new catalog entry.
- Naming: v3.1; `<name>.<kind>.ts`; one declaration per file; no `Module`/`Service`/`define*` here.
- Secrets: read by name from the runtime env inside `bootApp`; never logged.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly the seven entries `.`, `./react`, `./server`, `./worker`, `./browser`, `./native` and `./electron` — Validates: FR-001
- **P-002**: each subpath's `createApp` returns its target object: `ServerApp` (`key`, `ready`, `drain`, `close`, `handlers`), `BrowserApp` (`mount`, `hydrate`, `router`), `NativeApp` (`Root`), `WorkerApp` (`fetch`) and `DesktopApp` (`start`, `windows`) — Validates: FR-002
- **P-003**: `bootApp(wiring, { roots, env, overrides })` binds each config built from the raw env under its base class, binds `AppWiring`, and resolves the bound `ErrorReporter` or falls back to `ConsoleErrorReporterDriver` — Validates: FR-003
- **P-004**: `Contexts` nests the components registered through `registerContext` in the wiring's `contexts` order, and `registerContext` refuses a second component for the same key — Validates: FR-004
- **P-005**: `Controller` is exported from `./server` and from no other entry, and `Controller(...)` returns a class made by `createKind` — Validates: FR-005
- **P-006**: no entry of `@stackra/app` exports a `Module`, a `Service` or a `define*` symbol — Validates: FR-006
