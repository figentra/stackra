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

GET and DELETE query strings are typed by the call's registered input schema (`coerceQueryInput`): finite numbers,
`"true"` and `"false"`, and arrays element-wise; enums and strings stay as sent, and a value that does not fit stays a
string so validation refuses it. A void output answers 200 `null`.

New reachable surface: the typed `api()` skipped every entry whose input or output was not a schema class of the
member, so those had no HTTP route. They now get one, behind the same guards, authentication and permission checks:
generated search and report queries, replica queries (`ReplicaPage` output) and any other action or query whose
schemas come from a package. The gen fixtures show it only for the billing unit fixture (`BILLING_IR`), and no golden
gains an endpoint. A hand-written `Controller` is now served too (every method, behind the guards), reachable with no
`Authorization` header; a present but invalid or expired one is 401 and never falls back to anonymous.
