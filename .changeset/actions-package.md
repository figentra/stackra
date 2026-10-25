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

For offline clients (ADR 0338, 0337): a device's replayed calls run in the order of their per-device sequence
(`CallOptions.device`, set by the generated adapter from `@stackra/clients`' `DEVICE_ORDER` headers), a refusal settles
its sequence, and a resend replays or is refused `device_sequence_out_of_order`; `offline.cap` is reconciled per device
and refused with `offline_cap_reached`; a `replica:` query answers `ctx.replica(fill, slice)` in the client's
`ReplicaChanges` shape from `ReplicaFeed`'s change log; an `accepts: { ruleVersion, evaluator }` action records a
review item when the server's figure differs or the rule version is older, and never refuses the sale. The four new
ports (`DeviceSequenceStore`, `OfflineCapStore`, `ReplicaLog`, `ReviewItemSink`) ship with memory drivers.
