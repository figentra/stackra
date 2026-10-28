# AGENTS — @stackra/actions

Action, query, precondition, extension and interceptor kind bases, the fixed pipeline and the action testing helpers.
Member at `packages/application/actions` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries
`.`, `./contracts`, `./devtools`, `./node`, `./testing`.

## Where code goes

| You are writing…                        | It goes in…                                                    |
| --------------------------------------- | -------------------------------------------------------------- |
| A kind base                             | `src/core/bases/<name>.base.ts`                                |
| A function, a type, a constant, an enum | `src/core/{functions,types,constants,enums}/`                  |
| A refusal                               | `src/core/errors/<name>.error.ts`                              |
| A service or a driver                   | `src/core/services/`, `src/core/drivers/`                      |
| The configuration                       | `src/config/rate-limit.config.ts`, its shape in `core/schemas` |
| A port, an exchanged type or its enum   | `src/contracts/{ports,types,enums}/`                           |
| Anything that imports `node:`           | `src/node/`                                                    |
| A test helper                           | `src/testing/{functions,constants,types}/`                     |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it                    |

## Entries and barrels

- `src/{core,contracts,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- The ports are exported from `./contracts` only, `AsyncContextStorageDriver` from `./node` only (ADR 0294 decision
  15). `./contracts` imports no other entry; `.` never imports `node:` (browser bundles import its enums).
- `./testing` registers the testing-module plugin when imported; `sideEffects` stays `false`.

## This package

- The pipeline order is fixed (ADR 0138 as amended): never reorder `ActionPipeline.steps`, never add a step outside
  `PipelineStage`. Permission fails closed; every other missing port skips its step or errors when the call needs it.
  Device order (ADR 0338 d1) wraps the steps like the audit, so any refusal settles a device's sequence; the offline cap
  belongs to the idempotency step and the `accepts` review to `handle` (inside the unit of work).
- A device id reaches `CallOptions.device` only after the transport matched it to the verified session's device; the
  pipeline never trusts the header alone. Spell no header name here: they are `DEVICE_ORDER` of `@stackra/clients`
  (which depends on this package). Device sequences are not contiguous: never compare with `last + 1`.
- A replica answer is the `ReplicaChanges` wire shape of `@stackra/query` (`rows`, `removed`, `cursor`, `asOf`,
  `full`); the cursor arrives as the query's `cursor` input. A replica's slice comes from the query's `handle` after
  it authorized it, never straight from input.
- Permission fails closed. Approval runs only when an `ApprovalGate` is bound; an action that declares
  `approval: true` fails closed without one, and so does one that declares `stepUp` without a `StepUpCheck`
  (STA-813, STA-814). Never make every pipeline bind a gate again: the iam, entitlements, queue and workflow
  pipelines bind none. The `LimitReservation`
  wraps the unit of work (reserve, then commit) and a successful call's audit entry is written inside it.
  `propose` runs the steps up to validation and meters a draft; it never reaches approval or `handle`.
- Approval, the live-configuration guard and meters decide nothing in code: the gate's rules, the environment and the
  usage quotas are data the drivers read. A `structural` action or a `meter` without its port bound is an error.
- A plan-sized area bucket comes from the bound `RateLimitBudget` (a value entitlement), never from code; its answer
  wins over `RateLimitConfig`, which stays the default when it answers `undefined` or none is bound.
- The area bucket key is (app, scope), never the actor alone; a rate-limit refusal always carries the refusing
  bucket's numbers (never its key) and, with an outbox bound, one `actions.rate_limited` usage event (STA-1477).
- Never import `@stackra/iam`, `@stackra/workflow`, `@stackra/queue`, `@stackra/database` or `@stackra/tenancy`; they
  depend on this package and implement its ports.
- Identities are gen's: the runtime reads them from `registerActions`, never derives a module key or a permission.
- The current scope is `scope` (a `ScopeRef`) on `CallOptions`, `CallDescriptor` and the call context (ADR 0327
  decision 6). `scopeId` stays on the descriptor and the context only while iam, entitlements and workflow read it;
  never add another tenant field or option (R-59, ADR 0323): the cron option is `perScope`.
- `sandbox` and `client` on `CallOptions` come from the verified credential and the connection (or the edge's trusted
  forwarding header), never from input. The sandbox flag reaches the descriptor and the context; the client reaches
  `ctx.client` only: never put it on `CallDescriptor`, an audit entry or a log line (STA-1248).
- `origin` on `CallOptions` (a `CallOrigin`) comes from the verified credential, never from input; it rides on the
  descriptor (so the audit entry has it) and `ctx.origin`. A new `CallOriginKind` is an ADR change (ADR 0456).
- `ctx.publish(event)` is only for an integration event no model owns; a model's event is recorded on the model. It
  writes through `EventOutbox` at once, so it belongs in `handle` (inside the unit of work), never in `afterCommit`.
- A replica change reaches readers at its scope node or above it; only `cascade: true` also reaches the readers below
  (a recall). Never widen the default rule: a driver's read must keep both cases (ADR 0456 decision 3).
- A raw-body query output is `rawBody(...)`; the transport keys on the `~raw` marker, never on the field names.
- The source keeps to erasable syntax: no parameter properties, no `#private` fields.
- Event ids come from `@stackra/contracts`' `mintPublicId("evt")`; never add a local minter (STA-1380).

## Devtools

- `./devtools` is the dev-only devtools entry (ADR 0246 decision 4): `defineActionsDevtools(kit)` defines `actions.registry` on the kit, data only. No
  UI, no `@stackra-pro/*` import (ADR 0461: the panel UI is Pro, the data is free). Nothing in `.` or a production path
  imports `./devtools`.
- It takes the kit by shape, `DevtoolsTabSink` from `@stackra/container/devtools`, never `@stackra/devtools-kit`
  (the kit depends on container and events, so a dependency on it would close a cycle).
- Tab ids are dotted lowercase, `actions.*` first. A tab that carries inputs, payloads or personal data sets
  `sensitive: true`.
- ADR 0127 does not list `./devtools` among the allowed entries and gen's `entryOf` does not know it yet; the barrel
  is a hand-written stand-in until both are settled (see the stackra-208 hand-off).

## PII

| Data         | Where                                   | Handling                                                                     |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| Call input   | `fingerprintOf`, the idempotency store  | Hashed (SHA-256) for the fingerprint; the output is stored for 24 hours.     |
| Audit fields | `ctx.audit(...)`, the `AuditTrail` port | Whatever the handler adds; never add a classified field. Stored by the port. |
| Client IP    | `ctx.client` (`CallClient`)             | Held for the call only; a handler that keeps it hashes or truncates it.      |
