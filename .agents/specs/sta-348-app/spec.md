# Feature Specification: `@stackra/app` wave 3, createApp per runtime target

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/app` (runtime, wave 3) for real: `createApp` per target returning the runtime object of ADR
0295 decision 8, the app contexts, and the `Controller` kind.

## Impact

- **Apps touched**: none (the template's generated entries already import the shapes built here; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/runtime/app` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables; no tenant word
- **Secrets**: none stored. Configuration secrets are resolved by name from the runtime's own environment (runway's
  Infisical sync, ADR 0173) and never logged
- **ADR needed**: no (ADR 0295 decisions 7 to 10, ADR 0127 2026-10-24 note, ADR 0251, ADR 0263)
- **New dependencies**: none new to the catalogs. Workspace: `@stackra/contracts`, `@stackra/container`,
  `@stackra/config`, `@stackra/errors`, `@stackra/i18n`, plus `@stackra/csp` (the browser nonce provider and the
  desktop CSP header). Optional peers from existing catalogs: `react`, `react-dom`, `react-router` (frontend),
  `electron` (desktop), `react-native`, `expo-splash-screen` (mobile)
- **Deploy modes**: same in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`; ADR 0120, 0127, 0173, 0251, 0263, 0295 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (the desktop hardening baseline and the bridge allow-list are security boundaries)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entries `.`, `./react`, `./server`, `./browser`, `./native`,
  `./worker`, `./electron`; Q2 accepted: `Module`, `Service` and `define*` left this package for `@stackra/container` and
  `@stackra/contracts`; A13 recommendation taken: `Controller` lives in `./server`; ADR 0127 2026-10-24 note allows the
  runtime-target entries

## User Scenarios & Testing

### User Story 1 - A service boots from its generated entry (Priority: P1)

`.stackra/entry/server.ts` calls `await createApp(CommerceModule, { wiring })`; the generated Encore app imports `app`.

**Independent Test**: `src/server/functions/__tests__/create-app.function.test.ts`.

1. **Given** a wiring, **Then** `app.key` is the member key, `ready()` is true and `handlers.byKind` lists the bound
   classes per kind.
2. **Given** a call in flight, **When** `drain()` runs, **Then** it resolves only after the call settles, `ready()` is
   false, and a new `handlers.run` rejects with `AppDrainingError`.
3. **When** SIGTERM arrives, **Then** the app drains, closes the container (each `onApplicationShutdown` once) and exits
   0; a failing shutdown is reported and exits 1.

### User Story 2 - The web Worker serves every request (Priority: P1)

**Independent Test**: `src/worker/functions/__tests__/create-app.function.test.ts`.

1. **Given** valid bindings, **Then** the context factory gets the request, the validated env, `ctx`, a request
   container and the reporter, and the router runs with that context.
2. **Given** a bad env, a failed boot or a router throw, **Then** the error is reported once and the answer is the
   crash page (500, `no-store`); a failed boot is retried by the next request.

### User Story 3 - Browser targets hydrate or mount (Priority: P1)

**Independent Test**: `src/browser/functions/__tests__/{create-app,hydrate-route}.function.test.tsx`.

1. `createApp(wiring)` then `hydrate({ nonce })` hydrates the document under the container and the nonce.
2. `createApp({ wiring, routes })` then `mount(root)` renders the route tree under the container; without routes
   `mount` throws.
3. `hydrateRoute(root, { wiring, layout, route, locale, contexts })` renders the route inside its layout with the page
   locale's catalogues; an unknown locale rejects.

### User Story 4 - The mobile app boots behind the splash (Priority: P1)

**Independent Test**: `src/native/functions/__tests__/create-app.function.test.tsx`.

1. `createApp(MobileModule, { wiring })` is synchronous; `Root` renders nothing while booting, then the contexts with
   the default locale's catalogues, applies the RTL switch and hides the splash. A boot failure is reported and thrown.

### User Story 5 - The desktop main process is hardened (Priority: P1)

**Independent Test**: `src/electron/functions/__tests__/{create-app,bundle-file-url}.function.test.ts`.

1. `start()` opens one window with context isolation, sandbox, no node integration, web security and no webview, and
   loads `app://bundle/` (the dev origin in dev).
2. The CSP header is added to every response and every permission is denied.
3. A bridge call is answered only from a trusted frame and only for a bound `bridge` class; a refusal is not reported,
   any other error is.
4. `app://` never serves a file outside the renderer folder.

### User Story 6 - Client contexts mount in graph order (Priority: P1)

**Independent Test**: `src/react/contexts/__tests__/*.test.ts(x)`.

1. `Contexts` mounts the wiring's `contexts` outermost first, or the registered module keys in graph order.
2. A named key with no registered context throws; `registerContext` refuses a second component for a key.

### User Story 7 - A raw endpoint is a Controller (Priority: P2)

**Independent Test**: `src/server/bases/__tests__/controller.base.test.ts`.

1. `extends Controller({ path })` registers kind `controller` with its path; `handle(request)` answers a `Response`.

## Requirements

- **FR-001**: Seven entries, exactly the registry row (`.`, `./react`, `./server`, `./worker`, `./browser`, `./native`,
  `./electron`), all allowed by the ADR 0127 2026-10-24 note.
- **FR-002**: `createApp` returns the ADR 0295 decision 8 object per subpath: `ServerApp` (`key`, `ready()`,
  `drain()`, `close()`, `handlers`), `BrowserApp` (`mount(root)`, `hydrate()`, `router`), `NativeApp` (`Root`),
  `WorkerApp` (`fetch(request, env, ctx)`), `DesktopApp` (`start()`, `windows`).
- **FR-003**: One boot (`bootApp`) for every target: configuration built from the target's raw env and bound under the
  base class; the wiring bound as `AppWiring`; the bound `ErrorReporter` or a console fallback.
- **FR-004**: `./react` exports `Contexts` and `registerContext`; the wiring's `contexts` and `messages` sections are
  this package's.
- **FR-005**: `Controller` is a kind base made by `createKind`, exported from `./server` only.
- **FR-006**: No `Module`, `Service` or `define*` here (Q2).

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/app/*` exists with the shape it uses:
  `createApp` from `./server` (`(Module, { wiring })`), `./worker` (`(wiring, { env, build, context, crashPage })` and
  the type `WorkerRequest<E>` with `request`, `env`, `ctx`, `container`, `reporter`), `./browser` (`(wiring)` and
  `({ wiring, routes })`, `hydrate({ nonce })`, `mount(root)`), `./native` (`(Module, { wiring })` returning `Root`),
  `./electron` (`({ wiring, bridgeSenders, rendererDir, preload, dev, updateFeed })` with `start()`); `hydrateRoute`
  from `./browser`; `Contexts` from `./react` (`locale`, `messages`, `children`).
- **SC-002**: Every public symbol has a test beside it; the barrel tests pin each entry's exports.
- **SC-003**: Lint and format pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- The service worker entry (`./sw`, the template's `offline.ts` aside): no template import of `@stackra/app/sw`.
- Device locale and a stored locale choice on native: they need `@stackra/storage` wiring; native starts on the
  configured default locale.
- Electron fuses: set at packaging by `@stackra/platform/electron/after-pack`, not at run time.
- The generated Encore adapters that call `handlers`: gen (STA-339).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
