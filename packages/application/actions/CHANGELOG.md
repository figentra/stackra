# @stackra/actions

## 0.33.0

### Minor Changes

- 54aa1e7: An action may declare `stream: true`: its `handle` answers a `ReadableStream` of JSON chunks, sent to the one caller as server-sent events (`data:` per chunk, `data: [DONE]` at the end, a `: ping` after 15 s quiet, `no-store`, no compression, no proxy buffering). The call's transaction commits when `handle` returns the stream, so the stream's writes run in `ctx.detach()` steps. The caller's forwardable token is held until the stream ends or the caller goes away, never longer. A stream action takes no `job`, `offline` or `tool`, and only `Idempotency.Never` (`stream_not_replayable`); the call descriptor carries `stream: true`.
- ad4e5bf: A queued job's call knows which attempt it is: `ctx.attempt` (`{ number, last }`, the new `CallAttempt` type) on every call context, set by the queue worker through `CallOptions.attempt` and absent for a direct call. `last` is true when no retry follows, so a job that may give up (a quota it cannot read) can act on its last attempt instead of throwing again.
- 93d63bb: Tests on `useDrivers("memory")` no longer need per-test overrides for two fail-closed ports and for seeders' services (os#256).
  
  - **`@stackra/actions/testing`:** the testing plugin now offers a memory `RateLimitStore` (`MemoryRateLimitStoreDriver`) and a memory `JobDispatcher`. The new `MemoryJobDispatcherDriver` keeps every queued job in `jobs` and runs none.
    - Production still fails closed: these bind only in a testing module, and only when the test picks "memory".
    - `ApprovalGate` is left out on purpose. An action that declares `approval` fails closed without a real gate and its binding store (ADR 0509), so a test that runs one binds `MemoryApprovalGateDriver.of(...)` and `MemoryApprovalBindingStoreDriver` itself.
  - **gen:** a service that only a seeder injects is now wired. Example: a minimal seeder's `SettingsPackService`. Before, `.seed(XMinimalSeeder)` failed with "Nothing binds SettingsPackService".

### Patch Changes

- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [93d63bb]
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/cache@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/cache@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 298af71: `ctx.detach()` holds an action's isolation past its transaction, for a stream or a long agent loop. Each `detached.isolated(work)` step runs in a new `CallIsolation` transaction with the call's settled actor and scope, commits or rolls back alone, and holds no connection between steps. `RequestContext.detached()` answers inside `detached.run(...)`, so a service below the loop can open its own step. `fakeActionContext()` gains a `detach()` that runs each step as it is.
- 6473cf1: A detached call (`ctx.detach()`) now works with the database. `detached.run` enters every wrapper registered in the new `DETACHED_RUNS` (`@stackra/actions/contracts`), and the database registers one when a driver connects: the loop's work runs on a fresh fork, outside the call's committed transaction (which MikroORM otherwise keeps in the context of a continuation started inside it), and `Database.detached()` answers the call's step, per database instance. Inside a detached call, every `CrudService` operation that runs outside a transaction runs as its own step: a short transaction with the call's isolation (`each`, `chunk` and `metrics` excepted). Outside a detached call nothing changes.

### Patch Changes

- @stackra/testing@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0
  - @stackra/cache@0.31.0

## 0.30.0

### Minor Changes

- 6005425: An API-key caller (a call with a credential, an `api_client` actor or an `api_key` origin) must send an `Idempotency-Key` on every write, whatever the action declares; every other caller keeps the declared policy. The idempotency scope now includes the API key and the mode (test or live), so a principal's keys never share an answer. Existing records are keyed afresh once and expire within the retention.
- 0394e56: The idempotency step tells a key still in flight (`idempotency_key_in_progress`, same input) from a reused one (`idempotency_key_reused`, other input), and a call refused for a reason no retry can change keeps its refusal under the key: a retry gets the same refusal and `handle` does not run again. A retryable refusal or a plain error still frees the key. `IdempotencyStore` gains `completeRefused(key, fingerprint, refusal, ttl)` and `IdempotencyRecord` a refusal form; the memory and Valkey drivers implement it. Breaking for a custom store: implement `completeRefused`.
- 96b5241: **Route change for anonymous-only calls.** An action or query whose actors are exactly `[ActorKind.Anonymous]` (served
  with `auth: false`) now defaults to the `public` API area, in gen and at runtime, so its route is `/public/...` and it
  sits where no gate asks for a principal. A written `area` still wins, and a call with any other actor keeps the
  service's area or `app`. Gen's identity lock accepts the move under the call's own area, as for STA-340. What a product
  does on its bump: run `stackra gen` and commit the regenerated `stackra.manifest.json` and `openapi.json`.
- 17fafdd: A ninth actor kind, `ActorKind.ApiClient` (`api_client`): a tenant's server calling with an API key. An action or query
  declares `public: true` or `public: { scopes, publishable }` to answer one; every other operation refuses it, and so
  does a call without a key. `CallOptions.credential` carries the verified key (id, scopes, publishable, version pin) onto
  the descriptor with `descriptor.public` (the required scopes and whether only exact keys count: L3 and above, approval
  or step-up). iam's `AccessControl` checks an `api_client` call's scopes (`keyCovers`: exact keys, or selectors below
  L3); a publishable key calls a public write only when it opts in.
- 8c17109: The idempotency step reads its retention window from a bound `IdempotencyRetentionSource` (`@stackra/contracts`), so an
  operator shortens it without a deploy. The answer only shortens the window: it never passes the 24 hours of ADR 0136,
  an action's own shorter `idempotencyTtl` still wins, and a failed read fails the call. With no source bound the window
  stays 24 hours.
- 82dccb3: One shared owner-isolation helper. `@stackra/actions` now exports `inRowOwner(isolation, actorId, ownerId, id, work,
  missing?)`, `boundIsolation(resolver)`, `ClaimNotLoadedError` (`claim_not_loaded`) and `RowIsolationMissingError`
  (`row_isolation_missing`) from its `.` entry, so the tenancy families no longer each keep a copy. Every caller keeps
  its own system actor id (`sys_outbox_relay`, `sys_queue_worker`, `sys_scheduler`, `sys_workflow_runner`,
  `sys_privacy_holds`), the same refusals and the same rule: an owned row with no isolation bound is refused, never
  skipped. Queue and scheduler keep their prefixed refusals and codes (`job_row_isolation_missing`,
  `schedule_row_isolation_missing`, and their claim-not-loaded ones) and pass them to `inRowOwner`.
  
  `@stackra/outbox` still re-exports `boundIsolation`, `ClaimNotLoadedError` and `RowIsolationMissingError` from its `.`
  entry for this release only; the re-exports go away in the next minor, so import them from `@stackra/actions`. The two
  refusals now appear under `@stackra/actions` in the manifests, with the same codes. `@stackra/workflow` no longer
  depends on `@stackra/outbox`; `@stackra/data-transfer` now depends on `@stackra/actions`.
- ef49e63: The rate-limit step can read a scope's limits from settings, so an operator lowers them without a deploy. When a
  `RateLimitCapSource` (new port in `@stackra/contracts`) is bound, each area bucket number and each default action
  bucket is the lower of its own and the scope's cap; a cap never raises a limit, and a failed read fails the call.
  `@stackra/settings` ships the driver, `SettingsRateLimitCapSourceDriver`, over the new `RateLimitSettings` group
  (`rate_limit.<area>PerMinute`, `<area>Burst`, `actionPerScope`, `actionPerAddress`; `null` caps nothing). With no
  source bound, nothing changes.

### Patch Changes

- 418e195: A `Derived` action keeps deduplicating by its input for every caller but an API key, even when a key is sent: a generated client mints a fresh key per call, so a double click stays one effect.
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/cache@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Minor Changes

- 3361957: An action whose actors are exactly `[ActorKind.Anonymous]` may declare `credentials: "ignore"`, for a public page whose visitors may also be signed in elsewhere. The pipeline then runs a signed-in caller's call as a fresh anonymous actor and drops what the credential gave, and `serveGuardedCall` never verifies or holds that credential, so no user token is forwarded. Without the option such an action still refuses a signed-in caller. `Action({...})` throws, and gen refuses `credentials_ignore_not_anonymous`, when the actors are anything else. Limit: a host's optional `BearerTokenGuard` runs before the adapter, so it can still refuse an expired or invalid token on such an action; a host that serves these actions should let them pass that guard.
- 45afd22: `Action` and `Query` take an `entitlement` option (one entitlement class or a list), and gen now gates calls by it
  (STA-2059, ADR 0215). The manifest lists a call in the `gates` of every entitlement it names, of a quota whose meter it
  feeds (`meter`, `per` on the quota entry; `meter` and `entitlements` on the action entry) and of a limit counting a
  model it creates, including an entitlement or model a hosted package ships. A name that resolves to nothing fails the
  build with `entitlement_unknown` or `entitlement_counts_unknown`.

### Patch Changes

- Updated dependencies [b4b6422]
  - @stackra/container@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/cache@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Minor Changes

- 2b6f88c: `UsageRecorded` carries optional `dimensions`, a small map the usage service may rate by (`{ market: "eg" }`): at most
  8 snake_case keys with values of 1 to 64 characters, so a dimension never holds free text. A service that writes usage
  itself (Notify per channel and market) sets them; existing producers are unchanged.

### Patch Changes

- @stackra/testing@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0
  - @stackra/cache@0.28.0

## 0.27.0

### Patch Changes

- @stackra/testing@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0
  - @stackra/cache@0.27.0

## 0.26.0

### Patch Changes

- 9cee75d: The memory `AccessControl` runs record policies: `ctx.authorize(record)` asks the record's policy, as
  `IamAccessControlDriver` does, once `@stackra/iam`'s testing plugin has connected them through the new
  `connectRecordPolicies`. A module's "refuses another customer" test now means it on memory drivers. The IAM driver's
  policy helpers move into `decidePolicy`, `policyRowOf` and `isAnonymousCall`, shared by the driver and the plugin.
- @stackra/testing@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0
  - @stackra/cache@0.26.0

## 0.25.0

### Patch Changes

- @stackra/testing@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0
  - @stackra/cache@0.25.0

## 0.24.0

### Minor Changes

- 35959f6: An action or a query can name the data class it handles: `dataClass: DataClassification.Financial`, or a product's
  own `DataClass({ key })` class. Gen writes the key on the call's manifest entry (`dataClass`) and refuses a value it
  cannot read with `data_class_unknown`; the catalogue manifest schema names the field. Tamo's gateway uses it to keep a
  run in region by the most sensitive class among the tools it calls.

### Patch Changes

- f86dec4: The memory `AccessControl` refuses a restricted permission to a customer-realm user, as the policy decision point
  does: a restricted permission counts only through an explicit grant (`grant(permission)` in a test). A test of a
  staff-only read that is restricted now sees the shopper refused on memory drivers too.
- @stackra/testing@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0
  - @stackra/cache@0.24.0

## 0.23.0

### Minor Changes

- a42a80c: A service now proves who it is when it calls another service, and who it acts for.
  
  - An outgoing service call sends the service's own token (`Authorization: Bearer`). `ServiceTokens` in
    `@stackra/identity` answers it, with a memory driver for tests; the token is issued for the receiving product's
    project, set per module in `clients.audiences`.
  - When the call acts for a user, it also sends that user's own token in `Stackra-On-Behalf-Of`. `serveGuardedCall` in
    `@stackra/app/server` keeps that token for the one request and empties it when the request ends. It is never put on
    the actor, the call context, a log, an error or an event.
  - A user's token travels one hop. A service called for a user forwards it again only into an action that declares
    `onBehalfOf: { secondHop: true }`; otherwise its own calls carry the service token alone.
  - `ServiceClientSessionDriver` (`service`) is the `ClientSession` a service binds for its generated clients, and
    `ClientSession.headers` now receives the call it is about to send.
  - Generated endpoints name their action to `serveGuardedCall`, which reads its second-hop option. A hand-written
    controller forwards only a user's own token, never a forwarded one.

### Patch Changes

- @stackra/testing@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0
  - @stackra/cache@0.23.0

## 0.22.0

### Minor Changes

- 786848c: A branch user can now complete an action that needs approval. The isolation already ran a branch user's call as the
  tenant above the branch, but the pipeline still labelled what the call wrote with the branch id, so the approval
  binding was refused by the tenant's row policy and the request could not be parked.
  
  `CallIsolation.run` now hands its work the actor it runs as, with the tenant from the scope tree. The pipeline takes
  that tenant as the call's `scopeId`, on the descriptor and on `ctx`, before any step inside the isolation runs. So the
  approval binding and request, usage and analytics events, published events, audit entries and the query cache key
  all carry the tenant. The branch the user acts from stays on the new `CallDescriptor.branchScopeId`, and the actor is
  unchanged. With no isolation bound, nothing changes: `scopeId` and `branchScopeId` are both the actor's own claim.
  
  Rate limits and idempotency keys are now per tenant for a branch user: all branches of one tenant share the tenant's
  buckets and keys, as tenant-level users already did.
  
  The access log and the Postgres audit trail now store a branch user's records in the tenant's chain, not under the
  branch id. `AccessRecord` has an optional `scopeId`, which `AccessLogExplorer` fills from the call's context, and
  `AccessLogService.record` takes it as an optional last argument.

### Patch Changes

- Updated dependencies [acbee14]
  - @stackra/events@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0
  - @stackra/cache@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/cache@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Minor Changes

- 667a3b5: The idempotency step never keeps a `@ShownOnce` output field: it is left out before `IdempotencyStore.complete`, and a
  replay answers without it and with `secretOmitted: true`, so the client knows to rotate if it lost the first response.
  `ActionRegistration` takes the `output` class for this. `Action({ idempotencyTtl })` shortens how long a key and its
  output are kept; a window longer than 24 hours is ignored.

### Patch Changes

- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/cache@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Minor Changes

- 0da5f7a: Step-up works out of the box (STA-340). `@stackra/identity` ships `IdentityStepUpCheckDriver`, the `identity` driver of
  the actions pipeline's `StepUpCheck` (`requireAssurance` with `IdentityConfig.stepUpMaxAgeMinutes`; a call without
  assurance is refused). gen binds it by default in every service that declares `@stackra/identity`; a host without
  identity binds none and its step-up actions still fail closed. `@stackra/actions/testing` adds
  `MemoryStepUpCheckDriver`, picked by `.useDrivers("memory")`: a test passes `assurance` at the declared level to
  `run`, and a call without it is refused `step_up_required`.
- 0921f1f: `Idempotency.Never`: an action whose output must never be kept (a credential) ignores a sent `Idempotency-Key`;
  every call runs and nothing is stored in or replayed from the idempotency store. `HttpDevicePairingDriver` sends no
  `Idempotency-Key` on the credential pickup (`hubSender(config, credential, { idempotencyKey: false })`), so the hub
  never keeps the answer that carries the token.
- 0e0de4f: Gen refuses a misshapen call. `checkCallShape` runs once per action or query in the manifest pass and refuses a query
  whose permission is L2 or above (`query_above_l1`), a query with `preconditions` (`query_precondition`), an action with
  `cache` (`action_cache`), an L3 or L4 action a user can call with no `stepUp` (`step_up_missing`) and a client write,
  an action with an endpoint or a tool, with no written `idempotency` (`idempotency_missing`). Each refusal carries its
  fix. Write `idempotency: Idempotency.Optional` on a client write that is safe to repeat: it is the default the
  pipeline already applies, and it now also sets the tool's `idempotentHint`.
  
  The actions pipeline asks `StepUpCheck` only when the caller is a user. A service, job, system or agent call carries
  no assurance, so an action that both users and services call can declare `stepUp` and its service callers keep
  working; a user call with no `StepUpCheck` bound still fails closed (ADR 0406 as amended).
  
  `identity.operator.bootstrap`, `identity.session.end_user` and `privacy.hold.release` declare
  `stepUp: AssuranceLevel.Aal2`, so a user call to them now needs a bound `StepUpCheck`. The client writes of identity,
  privacy, access-log, loyalty-kit, data-maintenance, media and collaboration that declared no idempotency write
  `Idempotency.Optional`; their manifests gain the `idempotency` entry and `idempotentHint: true`.
- 0e0de4f: Step-up for the L3 and L4 user actions STA-2096 raised (STA-340):
  
  - `@stackra/actions`: `stepUp` also takes `{ exempt: "first-factor-enrolment" }`, for which the pipeline asks no
    `StepUpCheck`; the action enforces its own rule.
  - `@stackra/gen`: refuses the exemption on any action outside `FIRST_FACTOR_ENROLMENT_ACTIONS`
    (`step_up_exemption_unlisted`).
  - `@stackra/identity`: `identity.passkey.confirm` takes the exemption. A first strong factor needs a fresh sign-in;
    once the user has one, a new passkey needs AAL2. Each enrolment is audited with `firstFactor`.
  - `@stackra/loyalty-kit`: `points.redeem` and `points.confirm_redemption` need AAL2 from a user. `points.earn_visit` is
    service-only and loses its `POST /loyalty/visits` endpoint: call it from the till or booking service.

### Patch Changes

- 58e3066: `actingScopeId(actor)` and `claimedScopeIds(actor)` move to `@stackra/contracts`: the one answer to which tenant a call acts
  in (an agent's own `scopeId`, else the tenant of the human it acts for; any other actor's own `scopeId`). Every place
  that read `actor.scopeId` as the call's tenant now reads it: the pipeline's `CallDescriptor.scopeId` and `ctx.scopeId`
  (so rate limits, meters, idempotency, query cache keys, approvals and audit entries follow), the queue's job actor and
  unique key, IAM's node lookup, the automation principal check, the access-log outbox sink's `scopeId` stamp, and
  `PostgresAuditTrailDriver`, which now records an agent with no tenant of its own in its human's tenant instead of
  skipping it. A platform agent and every other actor kind are unchanged.
- 58a8fa5: Every write action's permission is at least L2 (STA-2096, owner decision 2026-11-04). gen refuses an action whose
  permission is L0 or L1 with `action_risk_below_write`. Raised: `collaboration.room.publish`, `media.upload.create`,
  `data_maintenance.synonym.create` and `.update`, `analytics.analytics_batch.ingest`, `consent.consent_snapshot.issue`,
  `identity.passkey.challenge`, `loyalty_kit.loyalty_account.enroll` to L2;
  `segments.segment.recompute` and `privacy.subject.export` to L2 (system); `loyalty_kit.loyalty_account.redeem` and
  `.stamp` to L3 (a points balance); `loyalty_kit.loyalty_account.expire` to L3 (system); `panel.view.share` to L2;
  `identity.passkey.verify` (it mints a session) and `identity.passkey.confirm` (it keeps a new key) to L4;
  `webhooks.webhook_delivery.send` (an external send) and `access_log.access_log_entry.purge` (it deletes for good) to L4
  (system).
- Updated dependencies [58e3066]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/cache@0.19.0
  - @stackra/config@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/testing@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/cache@0.18.1

## 0.18.0

### Patch Changes

- @stackra/testing@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/cache@0.18.0

## 0.17.2

### Patch Changes

- @stackra/testing@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/cache@0.17.2

## 0.17.1

### Patch Changes

- @stackra/testing@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/cache@0.17.1

## 0.17.0

### Patch Changes

- @stackra/testing@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/cache@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/cache@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/testing@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/cache@0.15.0

## 0.14.4

### Patch Changes

- @stackra/testing@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/cache@0.14.4

## 0.14.3

### Patch Changes

- @stackra/testing@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/cache@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/cache@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/testing@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/cache@0.14.1

## 0.14.0

### Patch Changes

- @stackra/testing@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/cache@0.14.0

## 0.13.0

### Patch Changes

- @stackra/testing@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/cache@0.13.0

## 0.12.0

### Patch Changes

- @stackra/testing@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/cache@0.12.0

## 0.11.1

### Patch Changes

- @stackra/testing@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/cache@0.11.1

## 0.11.0

### Patch Changes

- @stackra/testing@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/cache@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/cache@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/cache@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/cache@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/testing@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/cache@0.7.1

## 0.7.0

### Patch Changes

- @stackra/testing@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/cache@0.7.0

## 0.6.1

### Patch Changes

- @stackra/testing@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/cache@0.6.1

## 0.6.0

### Patch Changes

- @stackra/cache@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/testing@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1
  - @stackra/cache@0.5.1

## 0.5.0

### Patch Changes

- @stackra/testing@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/cache@0.5.0

## 0.4.0

### Minor Changes

- 71b37fc: Add the approval executor (STA-1724, ADR 0509). `ApprovalGranted` (`actions.approval.granted.v1`, ids only) and the
  `ApprovalGrantOrigin` port are in `@stackra/actions/contracts`; `ApprovalExecutorListener` is in `@stackra/actions/node`. On a
  grant from the store's service it reads the owning service's binding in a read-only isolation run as the tenant's system
  actor, checks `ScopeOwnership` and the snapshot hash, moves the request `granted → executing` by compare-and-set, and runs
  the pipeline as the stored requester under the key `approval:<id>` in a fresh run. A refusal settles `failed`; an
  in-flight answer, an identity outage or another error leaves the request `executing` for a retry; a request still
  `executing` 24 hours after its grant settles `unknown`. `ApprovalOutcome` gains `{ status: "unknown" }`, and
  `MemoryApprovalGateDriver` and the gate conformance suite follow; the driver is built with `MemoryApprovalGateDriver.of(options)` (STA-1884).
- 7a94bc4: Add the declarative approval stage (STA-1724, ADR 0509). `Action({ approval })` takes `true` or an `ActionApproval`
  (`approvals`, `permission`, `expiresAfter` up to 30 days, `when`: an `ApprovalCondition`, whose `needed(input, ctx, settings)` gets its limited settings reader as an argument). `ApprovalGate` is now `decide`,
  `park`, `find`, `begin` and `settle`; the pipeline enforces `max(declared, decided)`, verifies a named approval id in core
  (`verifyApproval`) against the owning service's `ApprovalBindingStore` binding, parks the request after the isolation
  transaction rolled back, forces the key `approval:<id>`, and fails closed without a binding store, an `ActorStatusCheck` or
  an `IdentityResolver`. New refusals: `approval_mismatch`, `approval_expired`, `approval_not_granted`, `approval_consumed`,
  `approval_pending_limit`, `approval_identity_unavailable`; `approval_required` also carries `approvalsRequired` and
  `expiresAt`. `StepUpCheck.require` takes an optional `at`, `ApproverRefusal` gains `already_approved` and
  `approver_not_permitted`, and `approverRefusal` uses `actorChainOverlaps`. `./testing` ships `MemoryApprovalGateDriver`,
  `MemoryApprovalBindingStoreDriver`, `MemoryActorStatusCheckDriver` and the two port conformance suites. A condition that declares `reads` with no `ApprovalSettingsSource` bound is refused `approval_settings_unavailable` before `needed()` runs.
  
  ### Breaking
  
  - `ApprovalGate.check` is removed. The gate is now `decide`, `park`, `find`, `begin` and `settle`.
  - A park from tenant approval rules alone (no declared `approval` stage) now needs an `ApprovalBindingStore` bound.
  - Who must act before upgrading: today only OS tasks-approvals implements the gate, on unmerged branches
    (`ServiceApprovalGateDriver` and `RecordsApprovalGateDriver`), and OS content, webhooks and workflow-automations plan to
    bind it in their specs. Commerce binds none. Each must port to the new port shape and bind the binding store (the
    Postgres driver in `@stackra/tenancy/node`) before moving to the release that carries this.
- 5fc0db7: Listeners are audited like actions. With a bound `ListenerAuditTrail` (`@stackra/events/contracts`), every listener delivery that ended writes one entry: the system actor `sys_listener` that handled it, the event's id as correlation, the event's actor as `causedBy`, and what the listener added with the new `ctx.audit(fields)` (never a classified value), inside the delivery's transaction. `@stackra/actions` ships `OutboxListenerAuditTrailDriver`, which writes it as the same `audit_entry.recorded` event an action call's entry is (`key: listener:<Listener>`).

### Patch Changes

- a7eaed4: A pipeline test proves `CallIsolation` receives the verified actor and the resolved scope as given, whatever tenant or
  scope the call's input names (STA-1823).
- a8c358a: `MemoryApprovalGateDriver.of` builds the class it is called on, so a test's subclass keeps its overrides.
- 0b660e0: `CallInput<T>` is now `InputFields<InputOf<T>>` (STA-1694): a field with an initializer is optional in `run()`,
  `ctx.dispatch`, the queue, the scheduler and the generated client call, as the parse accepts. `handle` still receives the
  full class. Run `stackra gen` to see it; until then every field stays required.
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [90f55b1]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [5fc0db7]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/cache@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Minor Changes

- a60f4e9: Run every call in one isolation transaction (STA-1699, ADR 0495): add the `CallIsolation` port (`run(actor, scope, work,
  { readOnly })`), and the pipeline runs everything after the tenancy step inside it when one is bound, an action writable
  and a query read-only. The unit of work is a savepoint of that transaction, so `afterCommit` work, the idempotency
  completion, the offline cap record and the read-your-writes mark now run after the real commit, and a refused query's
  usage event is written after its read-only transaction ends. With none bound a call runs as before.
- c4443b5: Refuse a keyed call that joined a running transaction when the idempotency store cannot join it (STA-1699, ADR 0495
  note of 2026-11-01): `IdempotencyStore.joinsTransaction` (true for the Postgres store), `UnitOfWork.inTransaction()`
  (answered by the database unit of work) and the new `IdempotencyStoreNotTransactionalError`
  (`idempotency_store_not_transactional`), thrown before anything is claimed or run.
- b00096a: Add the `DeviceStatusReader` port (with `MemoryDeviceStatusReaderDriver`) and `DeviceRevokedError`: with a reader bound,
  the pipeline refuses a call from a revoked device (`device_revoked`, 403) before device order, so nothing runs and its
  sequence is not settled. With no reader bound nothing changes.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/cache@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- 2d5a888: Add `RateLimitConfig.actionDefault` (STA-1588): an action or query with no `rateLimit` of its own now takes from a
  default bucket per scope (`perScope`, 1200 calls a minute) and, when the call carries a client, per hashed client
  address (`perAddress`, 300 a minute). An action's own `rateLimit` replaces both. The store is handed the address's
  SHA-256, never the address.

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0
  - @stackra/cache@0.2.0

## 0.1.0

### Minor Changes

- f7fb4ad: Restore pipelines that bind no `ApprovalGate`: the approval step runs only when a gate is bound, and only an action
  that declares `approval: true` fails closed without one (STA-813, ADR 0397 as amended); the testing pipeline no longer
  injects an open gate. Add step-up assurance: `CallOptions.assurance` and `ctx.assurance` (`amr`, `authTime`, `level`),
  the `AssuranceLevel` enum, the `StepUpCheck` port and the action option `stepUp`, checked right after the permission
  and failing closed without a driver (STA-814, ADR 0406). Add the `toHaveAudited` matcher and `RunResult.audit` to
  `./testing` (STA-820). Add `postgres` to the store driver names so runway selects @stackra/database's Postgres
  idempotency and rate-limit stores (STA-756).
- e7a388a: Add the dev-only `./devtools` entry: `defineActionsDevtools(kit)` defines the `actions.registry` devtools tab, each
  registered action and query with its key, kind, class, permission, risk, effects and input class (stackra-208, ADR
  0246, ADR 0461).
- 68dd2a5: Add the approval step (`ApprovalGate`, `approval_required` with `CallOptions.approvalId`), the `Effect` tags with
  `bulk` on `ActionRegistration` and `CallDescriptor`, `structural` actions guarded by `LiveConfigurationGuard`
  (`live_read_only`), `meter` with the `UsageRecorded` event written in the unit of work, the `OutboxAuditTrailDriver`
  with `AuditEntryRecorded`, the offline cap's `amountField`, and the Valkey idempotency and rate-limit stores with
  `StoresConfig`.
- e0f2fc8: Add the `memory` AccessControl driver to `@stackra/actions/testing`: it allows every permission unless a test denies one
  with `denyPermission(name)`, so a testing module on memory drivers binds AccessControl.
- 2787c1e: Add `@stackra/actions`, actions and queries of the programming model v3.1: the called-only kind bases
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
- df3f38b: Declare action effect tags with `effects` (`ActionEffects`, snake_case `Effect` codes); make the runtime `tool`
  default match gen (an action a user can perform is a tool unless `tool: false`); add the `LimitReservation` port that
  wraps an action's unit of work (reserve, then commit); write a successful call's audit entry inside the unit of work;
  fail closed when no `ApprovalGate` is bound (bind `OpenApprovalGateDriver` for an app with no approvals); add
  `ActionPipeline.propose` (a metered draft with no effects) and the approver rule check `approverRefusal`.
- 4413118: Add the request origin: `CallOptions.origin` (`CallOrigin` with a `CallOriginKind` of `storefront`, `console`,
  `api_key` or `agent`, from `./contracts`), which the pipeline carries to the call descriptor, the audit entry and
  `ctx.origin`; `AuditEntryRecorded` gains optional `originKind` and `originId`. Add `ctx.publish(event)`, which writes an integration event no model owns through the `EventOutbox` in the
  action's unit of work. Add `ReplicaChange.cascade`: a change stamped above a reader's scope node reaches it on an
  incremental refresh (a lot recall), and the memory replica log honours it. `fakeActionContext` records published events.
- a6ec591: Add the sandbox flag (`CallOptions.sandbox`, `CallDescriptor.sandbox`, `ctx.sandbox`) and the network client
  (`CallOptions.client`, `ctx.client`, the `CallClient` type) to the call, a raw-body query output (`rawBody`,
  `isRawBody`, `RawBody`), and let `toHaveAudited` assert the fields a `fakeActionContext()` passed to `ctx.audit`
  (STA-1248).
- 38fb3e2: Run every action, query and proposal in one `Tracer` span when a tracer is bound: named `<kind> <key>`, with the ADR
  0147 attribute names (`action`, `correlationId`, `actorType`, `actorId`, `scopeId`, `origin`, `outcome`, `code`,
  `latencyMs`) and no input or output values. A refusal is an outcome, not a failed span (stackra-411, STA-1513).
- 99665bb: Server-side consent (ADR 0472). `@stackra/consent` adds the signed, short-lived `ConsentSnapshot`:
  `ConsentLedger.snapshotRequest` (what the client sends), `ConsentSnapshotIssuer` (re-applies the rules and signs
  through the `Signer` port), `ConsentSnapshotVerifier` (key, signature, lifetime, policy version, Global Privacy
  Control), the `ConsentSnapshotKeys` port with `signer` and `static` drivers, `SnapshotConsentCheckDriver`, the
  `CONSENT_SNAPSHOT_HEADER` (`Stackra-Consent`) and the `snapshotLifetimeMinutes` and `snapshotClockSkewSeconds`
  settings. `@stackra/actions` adds `CallOptions.consentSnapshot`, `ctx.consent()` verified once per call through the new
  `ConsentCheck` port (`CallConsent`, `ConsentRefusal`), refused without a snapshot or a bound check and never refusing
  the call, and the `grantedConsent` test helper.
- 8ead1a8: The consent snapshot travels (ADR 0472). `@stackra/actions` adds `requestCallOptions(request)`, which a generated
  endpoint spreads beside the verified actor to lift `Idempotency-Key` onto `idempotencyKey` and `Stackra-Consent` onto
  `consentSnapshot`, as sent, and `CALL_HEADERS` (`./contracts`) naming both. `@stackra/consent` adds the consent
  endpoint in a new `./node` entry: `IssueConsentSnapshotAction` (`POST /consent/snapshots`,
  `consent.consent_snapshot.issue@1`, public, for anonymous visitors and users) with its input and output and
  `ConsentSnapshotPermissions.issue` (L0); `CONSENT_SNAPSHOT_PATH`; and the client half, `consentSnapshotHeaders`, which
  fetches a snapshot of `ledger.snapshotRequest()`, refreshes it when the decision changes or nears expiry, and answers
  the `Stackra-Consent` header for a session's `headers()`. `CONSENT_SNAPSHOT_HEADER` is now `CALL_HEADERS.consentSnapshot`.
- e7ee0a4: Raise database errors as refusals at the action boundary: `translateDbError` maps an optimistic-lock failure to
  `StaleVersionError` (409), a unique violation to `DuplicateRecordError` (409), foreign-key, check and not-null
  violations to `ConstraintViolatedError` (400) and deadlocks, serialization failures and timeouts to the retryable
  `TransactionConflictError`. `CrudService.update` takes `expectedVersion`, and `CallOptions.expectedVersion` (from
  If-Match) reaches handlers as `ctx.expectedVersion`.
- a701ccb: Add runtime database timeouts: `DatabaseConfig.timeouts` (statement, lock, idle in transaction) passed to `connect` as
  `DatabaseOptions.timeouts` and set on every primary and replica session, `TransactionOptions.timeout` as a
  transaction-local statement timeout, and an action's `timeout` option that the pipeline hands to
  `UnitOfWork.transaction(work, { timeout })`.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- 0e7eb1f: Serve a query's `cache` option on the server (ADR 0305 rule 31 as amended, STA-1445). `@stackra/actions` adds the
  `cache` step to `PipelineStage` (inside the interceptors, before `handle`): with a `Cache` from `@stackra/cache` bound,
  a query that declares `cache: { ttl, per?, invalidateOn? }` answers from its entry or runs `handle` once and stores
  the answer. `CacheScope` (`Principal`, the default; `Scope`; `Site`) says whom one entry is shared with, and the key
  carries the tenant, that holder and a fingerprint of the input and the request facts. `registerCachedQueries` and
  `QueryCacheEvictorListener` forget a query's entries in the event's tenant after an `invalidateOn` event commits, and
  `expectScopeCacheSafe` (`./testing`) proves a scope-wide query answers every caller the same. `@stackra/actions` now
  depends on `@stackra/cache`.
  
  `@stackra/gen` refuses `site_cache_reads_caller` (a site-cached query that reads its caller), registers the cached
  queries with `registerCachedQueries`, binds the evictor in a service that declares `@stackra/cache`, and wires each
  live query's refresh (`liveQueryRoutes`) in the boot of a service that runs `@stackra/realtime`. `emitBoot` takes the
  manifest as a second argument.
- 3d0354e: Query telemetry, the N+1 guard, batched link loading and a request memo (stackra-282). `@stackra/database` counts every
  statement through one ORM logger (normalised shapes, no values), hands a `QuerySample` to the new `QueryObserver`
  observers (`DatabaseOptions.observers`; `LoggerQueryObserverDriver` logs `database.slow_query`), ships
  `DatabaseQueryBudgetDriver` for the new actions `QueryBudget` port, `DatabaseConfig.queries` (slow, repeats, strict),
  `strictLoading` in `./testing`, `Extension.PgStatStatements` (ADR 0160 note) and batched `GraphQuery` relations.
  `@stackra/actions` adds the `queryBudget` option and `ctx.memo`. `@stackra/model` adds `Link.loadMany` and
  `Link.useBatchResolver`. `@stackra/infra-gcp` sets `log_min_duration_statement` and `auto_explain` from
  `shared.database.slowQueryMs` (1000 ms by default, `false` turns it off).
- 3b19f6d: Rate limits as ADR 0217 decision 2 promises (STA-1477). `RateLimitedError` carries the refusing bucket's
  `retryAfterMs`, `limit` and `remaining`, and the new `rateLimitHeaders` turns them into `Retry-After` and
  `RateLimit-*`. The pipeline keys the area bucket by (app, scope), passes the bucket's numbers on the refusal and, with
  an outbox bound, writes one `actions.rate_limited` usage event per refusal. `EntitlementRateLimitBudgetDriver` sizes
  the area bucket from the plan's `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` value entitlements. The
  generated HTTP adapter answers a rate-limited refusal with 429, its envelope and the headers.
- b163445: Add `Query({ reads: "replica" })`: the pipeline runs the query's `handle` on a read replica through the new
  `ReplicaReads` port, except inside the caller's read-your-writes window after its own committed action (recorded per
  instance, or carried by the transport as `CallOptions.lastWriteAt`). `@stackra/database` ships
  `DatabaseReplicaReadsDriver` over `Database.onReplica` and `DatabaseConfig.readYourWrites` (5 seconds by default)
  (stackra-402, STA-1504).
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 62a97c0: Add server analytics: `Action({ analytics })` and `Query({ analytics })` take `true` (the generic `action.called` event
  with key, outcome, duration and origin) or an `AnalyticsEvent` class (its declared fields from the output, then the
  input). The pipeline writes `AnalyticsTracked` (`analytics.tracked.v1`) through the outbox, in the unit of work for a
  successful action, only when the call's verified consent grants `analytics`. The new `@stackra/analytics/node` entry
  ships `RelayTrackedAnalyticsListener`, which sends each event to the bound `AnalyticsDriver` (stackra-410, STA-1512).

### Patch Changes

- f81699d: Type `AnalyticsTracked.properties` as `Record<string, Json>`, so gen compiles the event's shape (`unknown` is not a
  shape type).
- bc4acfc: `Cache` gains tags and `forgetTag(tag)` (`put` and `remember` take `{ tags }`), stale-while-revalidate
  (`remember(..., { stale })`), one fill across instances (`remember(..., { lock: true })` over the new `CacheLock` port)
  and lifetime jitter (`cache.jitter`), plus the `CacheMetrics` port with the `none`, `counting` and `logger` drivers
  (`cache.metrics`). Every driver now runs one shared `storedCache` over an entry store; the Valkey driver indexes keys
  and tags in sorted sets, so `forget` no longer walks `SCAN` and no command touches two keys. New config fields `lock`,
  `metrics`, `jitter` and `fill` (`wait`, `poll`). The driver constructors take the `CacheMetrics` port (and the Valkey and
  Workers drivers the `CacheLock` port). `@stackra/locking` ships `LocksCacheLockDriver` (`cache.lock: locks`) and now
  depends on `@stackra/cache`. `@stackra/actions`' test fakes implement `forgetTag` (STA-1435).
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 8c7a376: One public-id minter (STA-1380, ADR 0135). `@stackra/contracts` exports `mintPublicId(prefix, time?)`: the prefix and
  the lowercase Crockford base32 of a UUIDv7, in minting order within one process (also within one millisecond and when
  the clock steps back). `@stackra/model`'s `HasPublicId`, `@stackra/actions`' audit and usage events and
  `@stackra/outbox`'s writer all mint with it, so every `evt_` id has one form. The internal minters of actions (random
  lowercase), outbox (uppercase ULID) and model are removed. Ids already stored in the older forms keep working: the
  outbox's `evt_` check and the inbox's claim compare ids as strings.
- 150fa18: `JobOptions.backoff` is typed as the contracts `Backoff` instead of `string`. (stackra-223)
- 47554e7: `SHARED_CACHE_CONTEXT` has one home: `@stackra/actions` exports it from its `.` entry, and `@stackra/database`'s entity
  cache and cache invalidation import it from there instead of declaring their own copy.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0abe92d]
- Updated dependencies [c547718]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [4502f57]
- Updated dependencies [bc4acfc]
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
- Updated dependencies [483eb44]
- Updated dependencies [acff14a]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [376a093]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/events@0.1.0
  - @stackra/cache@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
