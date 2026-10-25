---
"@stackra/actions": minor
---

Add `@stackra/actions`, actions and queries of the programming model v3.1: the called-only kind bases
`Action({ key, actors, ... })` and `Query({ key, actors, ... })` with their surfaces (`endpoint`, `tool`, `intent`,
`job`, `offline`, `cache`), the bare `Precondition`, `ExtensionPoint` (with `after` and `before` slots) and
`Interceptor`, and `Extension<Point["slot"]>` in both forms; the enums `Idempotency`, `OfflineMode`, `IdMinting`,
`OfflinePrecondition`, `ConflictResolution` and `PipelineStage`; `ActionPipeline`, which runs tenancy, permission
(failing closed), preconditions, entitlement, flag, validation and idempotency, rate limit, interceptors and `handle`
in its unit of work, then the after-commit work and the audit entry, with the call's `scope` (a `ScopeRef`) on
`CallOptions`, `CallDescriptor` and the context; `ctx.period` over every panel range including `yesterday` and
`custom`; the `job.cron.perScope` switch; `RequestContext`; `RateLimitConfig` with
`RateLimitConfig$`; the memory idempotency and rate-limit stores; `registerActions`, `registerExtensions` and
`connectExtensions`; `./contracts` with the step and store ports; `./node` with the `AsyncLocalStorage` context
driver; and `./testing` with `run`, `fakeActionContext`, `fakeExtensionContext`, `extension` and the testing-module
plugin that adds `.withExtensions`.
