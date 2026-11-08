---
"@stackra/app": minor
"@stackra/gen": minor
---

Every generated HTTP adapter is an Encore raw endpoint that runs the request guards (STA-2577, ADR 0237 note of
2026-11-08). `@stackra/app/server` adds `serveGuardedCall` and `HttpConfig` (`app.http`, `maxBodyBytes`, 1 MiB by
default): the body is read once under the cap (413), every `RequestGuard` runs over the exact bytes (so the edge
signature covers the body), `CallAuthenticator` verifies an `Authorization` header (a bad one is refused, never
anonymous), then the input is parsed and the action pipeline runs; guard and authentication failures are one generic
401 or 403. `@stackra/gen` now writes `api.raw()` endpoints (auth: false to Encore) for actions, queries and
controllers through `answerCall` in `http.ts`, binds `app.http` in the wiring, and no longer writes `auth.ts` or the
`Gateway`.
