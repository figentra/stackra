# AGENTS — @stackra/actions

Action, query, precondition, extension and interceptor kind bases, the fixed pipeline and the action testing helpers.
Member at `packages/application/actions` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries
`.`, `./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                        | It goes in…                                                    |
| --------------------------------------- | -------------------------------------------------------------- |
| A kind base                             | `src/core/bases/<name>.base.ts`                                |
| A function, a type, a constant, an enum | `src/core/{functions,types,constants,enums}/`                  |
| A refusal                               | `src/core/errors/<name>.error.ts`                              |
| A service or a driver                   | `src/core/services/`, `src/core/drivers/`                      |
| The configuration                       | `src/config/rate-limit.config.ts`, its shape in `core/schemas` |
| A port or an exchanged type             | `src/contracts/{ports,types}/`                                 |
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
- Never import `@stackra/iam`, `@stackra/workflow`, `@stackra/queue`, `@stackra/database` or `@stackra/tenancy`; they
  depend on this package and implement its ports.
- Identities are gen's: the runtime reads them from `registerActions`, never derives a module key or a permission.
- The current scope is `scope` (a `ScopeRef`) on `CallOptions`, `CallDescriptor` and the call context (ADR 0327
  decision 6). `tenantId` stays on the descriptor and the context only while iam, entitlements and workflow read it;
  never add another tenant field or option (R-59, ADR 0323): the cron option is `perScope`.
- The source keeps to erasable syntax: no parameter properties, no `#private` fields.

## PII

| Data         | Where                                   | Handling                                                                     |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| Call input   | `fingerprintOf`, the idempotency store  | Hashed (SHA-256) for the fingerprint; the output is stored for 24 hours.     |
| Audit fields | `ctx.audit(...)`, the `AuditTrail` port | Whatever the handler adds; never add a classified field. Stored by the port. |
