# @stackra/app

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
