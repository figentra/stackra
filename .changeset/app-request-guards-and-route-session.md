---
"@stackra/app": minor
---

Add the `RequestGuard` extension point to `./server` and `ServerApp.handlers.guard(request, container)`, which runs
every contributed guard lowest `order` first and stops at the first refusal. Add `session` and `identity` to
`@stackra/navigation`'s `RouteServices` (`RouteSession`): the Worker loads the session into each request container,
the browser and native targets at boot, so a layout can gate on `ctx.session` (ADR 0457).
