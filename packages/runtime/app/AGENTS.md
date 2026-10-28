# AGENTS — @stackra/app

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/app: where code goes, entries and barrels, the package rules (the server boot and
         shutdown order, request guards and the route session included) and the rules that fail the build.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0305; ADR 0263; ADR 0260 (decision 4); ADR 0251 (decision 3); ADR 0457;
                    ADR 0437 (decisions 4 and 8).
-->

The app runtime: `createApp` per runtime target, the shared boot, the client contexts and the `Controller` kind.
Member at `packages/runtime/app` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./react`, `./server`, `./worker`, `./browser`, `./native`, `./desktop` (ADR 0295 decision 8; ADR 0127 2026-10-24
note).

## Where code goes

| You are writing…                     | It goes in…                                        |
| ------------------------------------ | -------------------------------------------------- |
| Boot shared by every target          | `src/core/{functions,services,drivers,types}/`     |
| A target's `createApp` and its types | `src/<target>/{functions,types}/`                  |
| The `Controller` kind                | `src/server/bases/controller.base.ts`              |
| The `RequestGuard` extension point   | `src/server/bases/request-guard.base.ts`           |
| The edge-header guard                | `src/server/services/edge-header.guard.ts`         |
| Its ports (keys, seen nonces)        | `src/contracts/ports/edge-*.port.ts`               |
| Their memory drivers                 | `src/server/drivers/memory-edge-*.driver.ts`       |
| The edge signature bytes             | `src/core/functions/sign-edge-request.function.ts` |
| The origin and CSRF guards           | `src/server/services/{origin,csrf}.guard.ts`       |
| CORS and CSRF configuration          | `src/config/`, shapes in `src/core/schemas/`       |
| The CORS answer headers              | `src/server/functions/cors-headers.function.ts`    |
| The route session (loader, part)     | `src/core/{functions,constants,types}/`            |
| A refusal                            | `src/<target>/errors/<name>.error.ts`              |
| React contexts                       | `src/react/contexts/`                              |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it     |

## Entries and barrels

- `src/*/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public file to its
  barrel and to that entry's `index.test.ts`.
- Every target imports `.` through `#core/*`; `.` imports no target. `./browser` and `./native` mount `Contexts` from
  `#react/*`. No symbol is exported from two entries.
- `.` loads no React, React Router, Electron or React Native; each optional peer is imported only by the entry that
  needs it.

## This package

- `Module`, `Service` and `define*` do not live here (ADR 0127 2026-10-24 note); never add them back.
- Configuration is built by `bootApp` from the target's raw env and bound under the base class; never read
  `process.env` or `import.meta.env` anywhere else.
- The server `createApp` awaits `options.boot` once the container is ready and aborts its signal in `close()` after
  the drain and before `container.close()`; the bus, inbox and relay stop there. It passes the boot only that signal:
  the boot connects with its service's Encore database url (STA-1401), and the migrate and seed CLIs use
  `directDatabaseUrl()` of `@stackra/database/node` (ADR 0473), so nothing here reads `DATABASE_URL`.
- Report each unexpected error once through the `ErrorReporter`; never report a refusal.
- No rate-limit code here: the area bucket per tenant lives in the `@stackra/actions` pipeline (`RateLimitBudget`);
  this package only forwards the verified tenant from the signed edge headers.
- The desktop hardening baseline is not configurable (ADR 0251 decision 3).
- A check every inbound server request passes is a `RequestGuard` subclass found with `getAll`; never a list of guards
  in `createApp`. `order` is a position in a fixed check sequence, never a business value.
- The edge signature bytes are fixed in `signEdgeRequest` only; the guard and the Worker both call it. Never
  re-join the fields elsewhere. A new covered field is a change to `EdgeSignatureInput`, the function and os-80 at once.
- The edge-header guard fails closed: no active key, a stale or future timestamp, a seen request id or a missing
  identity header is one `EdgeSignatureInvalidError`, with no detail. Claim the nonce only after the signature holds.
- Edge signing secrets come only from the bound `EdgeSigningKeys`; never a literal, never logged.
- Origins, methods, headers, credentials, max-age and the CSRF header and cookie are `CorsConfig` and `CsrfConfig`
  fields, never literals in a guard. Allowed origins are exact (`scheme://host[:port]`); never add a wildcard.
  `OriginGuard` and `corsHeaders` compare origins only through `isAllowedOrigin`.
- ADR 0325 rule 22 lives only in `apiCacheControl`, which the generated adapter applies to every API answer and which
  overrides a handler's header; never add a per-app switch for it (STA-1448).
- Server-check order: edge headers -100, origin -90, CSRF -80; the guards fail closed with one refusal each and no
  detail. `CsrfGuard` compares a double-submit token in constant time.
- The route session is loaded per request container on the Worker and never kept on a singleton: one visitor's session
  must never reach another request. `session` and `identity` are the only `RouteServices` members this package adds.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.
- `/readyz` runs the given `health` plus `container.getAll(HealthIndicator)`, resolved once after boot (`create-app.function.ts`); `answerProbe` owns the timeout and the body (a status per name, never a detail).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                    | Where                          | Handling                                                                 |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Environment and secrets | process memory (config fields) | Read by name into configuration instances; never logged or serialised.   |
| Bridge call inputs      | Electron main process          | Passed to the bridge as they are; never logged here.                     |
| Unexpected errors       | `ErrorReporter`                | Passed as they are; the reporter driver scrubs personal data (ADR 0232). |
