# Plan: `@stackra/actions` wave 3

**Spec**: `.agents/specs/sta-348-actions/spec.md`

## Shape

- `src/contracts/` (leaf): the eleven ports and the types they exchange (`CallDescriptor`, `AuditEntry`,
  `IdempotencyRecord`, `RateLimitBucket`, `RateLimitDecision`). Each port is implemented by the package that owns the
  step (iam, database, workflow, queue, entitlements, tenancy, the audit store); this package ships only the memory
  stores.
- `src/core/` (`.`): the kind bases on `createKind` / `registerKind` (container), the enums, the options and context
  types, the slot machinery (`createSlot`, `registerExtensions`, `connectExtensions`), `ActionPipeline`,
  `RequestContext`, the memory drivers, two refusals, and the zoned-time helpers behind `ctx.period` and
  `ctx.startOfDay`.
- `src/config/`: `RateLimitConfig` over `RateLimitOptions`, with the shipped `RateLimitConfig$` (logger's pattern).
- `src/node/` (`./node`): `AsyncContextStorageDriver`, the only `node:` import, so `.` stays browser-safe.
- `src/testing/` (`./testing`): `run` over the last compiled testing app's pipeline, the fake contexts, `extension`,
  and the plugin that adds `.withExtensions`.

## Decisions

- **Optional steps through the resolver.** The pipeline reads every port with `has` first, so an app without
  entitlements, flags, tenancy, audit or a database still runs; permission fails closed; a declared rate limit or an
  Idempotency-Key with no store is an error.
- **Identities from gen.** The pipeline never derives a module key or permission: `registerActions` gives them; without
  a row it uses the written key.
- **Slots find extensions at call time** through the registry (`registerExtensions`) and the connected app
  (`connectExtensions`), so a point never imports its extensions and the testing module scopes inline ones per compile.
- **Input as `Fields<handle input>`** (`CallInput`), because a shape's protected brand makes it nominal and callers pass
  plain objects.
- **Rate limit after idempotency**, so a replay costs no token; both run inside the block that releases a held key.
