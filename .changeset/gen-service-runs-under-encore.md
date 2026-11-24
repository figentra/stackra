---
"@stackra/gen": patch
"@stackra/app": patch
---

A generated service now answers real traffic under Encore. Three gaps, each found by running the health service under `encore run`:
`pipelinePorts` also reaches `AccessControl`, `CallIsolation`, `UnitOfWork` and `ContextStorage` for any service with an
action or a query (before, nothing injected them, so their drivers were never wired and every call failed closed with
"AccessControl is not bound"); a service port with several candidates, no selector and exactly one driver that is not a
testing stand-in defaults to that driver; and the wiring binds `VisitorIdentityService` over the `app.visitor` config row
(the generated adapter reads `VisitorConfig` for every anonymous call, which was a 500). The generated adapter reads a
request body with the new `webBodyOf` (`@stackra/app/server`) instead of `Readable.toWeb`, which ends the process with an
uncaught "stream.req.removeListener is not a function" on Encore's raw request, so a service's first POST no longer kills it.
