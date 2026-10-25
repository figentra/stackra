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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                         |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/application/actions`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/events`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                                                          |
| Security                              | PASS   | permission fails closed when no `AccessControl` is bound; idempotency and rate limits protect writes                                                                                                                                         |
| HTTP and events                       | PASS   | the pipeline runs every generated endpoint and tool; the package writes no HTTP response (ADR 0138, 0217)                                                                                                                                    |
| Tenancy                               | PASS   | tenancy is the `TenancyCheck` port the tenant-owning package implements; no tenant rule here                                                                                                                                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                       |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                             |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                                                            |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                      |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./node` and `./testing`, and every target resolves to a stand-in barrel under `src/` — Validates: FR-001
- **P-002**: `Action({ key, actors })` and `Query({ key })` return classes that record the checked options with their defaults, and `Extension<Point["slot"]>` types `handle` from the slot, so a handler with the wrong argument type fails to compile — Validates: FR-002
- **P-003**: `Enum.values` of `Idempotency`, `OfflineMode`, `IdMinting`, `OfflinePrecondition`, `ConflictResolution` and `PipelineStage` return the same codes in source order on every call — Validates: FR-003
- **P-004**: `ActionPipeline.execute` runs the steps in the order of `Enum.values(PipelineStage)` (tenancy, permission, precondition, entitlement, flag, idempotency, rate limit, interceptors, `handle`), is an error when no `AccessControl` is bound, and runs `afterCommit` work only after the unit of work commits; for every call the `CallOptions.scope` equals the descriptor's and `ctx.scope`, and for every `TimeRange` code `ctx.period` returns a non-empty window — Validates: FR-004
- **P-005**: the eleven ports (`AccessControl` to `ContextStorage`) are exported from `./contracts`, the memory stores implement `IdempotencyStore` and `RateLimitStore`, and the `./node` driver is the only file that imports `node:` — Validates: FR-005
- **P-006**: `RateLimitConfig` has the config key `actions.rate_limit`, and its shipped `RateLimitConfig$` is the schema class that `buildConfig(RateLimitConfig)` validates against — Validates: FR-006
- **P-007**: `registerActions` gives an action its module key and permission (without a row the pipeline uses the written key), and `registerExtensions` with `connectExtensions` let a slot find an extension class at call time without the point importing it — Validates: FR-007
- **P-009**: for every device and every series of replayed calls, a call runs only when its sequence is above the device's last settled sequence, every refusal settles it, a reused Idempotency-Key does not, and a sequence at or below the last settled one either replays the stored output of its Idempotency-Key or is refused `device_sequence_out_of_order` with the last acknowledged sequence; a call with no sequence is never ordered — Validates: FR-009
- **P-010**: for every capped action, within one window a device's applied calls never exceed `cap.count` and their summed `amount` never exceeds `cap.amount`; the refusal code equals the client's (`offline_cap_reached`) — Validates: FR-010
- **P-011**: for every replica partition and cursor the log still holds, `ctx.replica` returns every change after the cursor and nothing older, collapsed to the latest per id, within the caller's scope, with a cursor whose position never decreases; any other cursor yields a full fill of at most `limit` rows — Validates: FR-011
- **P-012**: for every `accepts` action, a call is never refused by the review, and a review item exists exactly when the evaluator answered and the answers differ by value or the rule version is older than `accepts.ruleVersion` — Validates: FR-012
- **P-008**: `run(CreateOrderAction, input, { as, idempotencyKey })` goes through the compiled testing app's pipeline, and `.withExtensions([extension(Point, "slot", { order }, fn)])` scopes the inline extensions to that compile — Validates: FR-008
