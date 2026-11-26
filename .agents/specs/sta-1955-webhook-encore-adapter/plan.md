# Implementation Plan: the inbound webhook route is exposed through Encore `api.raw` adapters

**Spec**: `.agents/specs/sta-1955-webhook-encore-adapter/spec.md` · **Linear**: STA-1955 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1955-webhook-encore-adapter/spec.md`

## Summary

`emitEncoreApi` reads `webhookIntegrations(ir)` and writes, per Integration route, two `api.raw` adapters (with and
without `:connectionId`) that call the generated `answerCall` with `anonymous`, `raw` and `credentials: "ignore"`,
running `InboundWebhooksController.handle`. `serveGuardedCall` in `@stackra/app` takes the new `credentials: "ignore"`
option (as an action could already declare it), so a provider's own `Authorization` header is not verified as a
Stackra credential. `emitEncoreHttp` writes the option into the generated `answerCall` and passes it through.

## Technical Context

- **Language**: TypeScript (ESM), Node 24; generated Encore TypeScript
- **Members**: `packages/developer/gen` (`@stackra/gen`), `packages/runtime/app` (`@stackra/app`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); gen golden fixtures (`__golden__/`)
- **Storage**: none
- **Runtime target**: node (gen); the generated adapters run in Encore

## Constitution Check

| Law                                   | Result | Note                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | generated code calls `@stackra/app/server`, as every adapter already does |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                |
| Security                              | PASS   | the receiver verifies the provider signature; guards and body cap apply   |
| HTTP and events                       | PASS   | routes per ADR 0308 rule 16; no wildcard route                            |
| Tenancy                               | PASS   | the connection id selects a connection the receiver resolves              |
| Delegation                            | PASS   | one session, one branch                                                   |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                    |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`; a new golden fixture                               |
| Versions and catalogs                 | PASS   | no dependency added                                                       |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                         |
| Licence tier (ADR 0077)               | PASS   | free                                                                      |
| Docs and ADRs                         | PASS   | gen README, golden README and a changeset; implements ADR 0308 rule 16    |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | provider webhooks reach the generated service     |
| On-prem    | same; the operator exposes the `/webhooks/` paths |
| Air-gapped | same where a provider can reach the install       |

## Correctness properties

- **P-001**: for every webhook Integration, exactly two adapters are written, at `/webhooks/<route>` and `/webhooks/<route>/:connectionId` — Validates: FR-001
- **P-002**: every webhook adapter states `anonymous: true`, `raw: true` and `credentials: "ignore"` — Validates: FR-002
- **P-003**: no generated path contains `*rest` under `/webhooks` — Validates: FR-003
- **P-004**: a service without webhook Integrations has no webhook adapter — Validates: FR-004
- **P-005**: with `credentials: "ignore"`, `CallAuthenticator` is never called and the actor is anonymous — Validates: FR-005
- **P-006**: for every endpoint the generated `answerCall` serves, the `credentials` it states reaches `serveGuardedCall` unchanged, and an endpoint that states none passes `undefined` — Validates: FR-006

## Architecture overview

Gen already emits a service's Encore `api.ts` and `http.ts`. The webhook adapters are written into `api.ts` next to the
action and controller adapters; `http.ts`'s `answerCall` gains the `credentials` field on its endpoint type and passes
it to `serveGuardedCall`. The runtime treats `credentials: "ignore"` from the adapter like an action's own option.

## Components and responsibilities

- `emitEncoreApi` (`gen/src/core/functions/emit-encore-api.function.ts`): the webhook adapters.
- `emitEncoreHttp` (`gen/src/core/functions/emit-encore-http.function.ts`): the pass-through.
- `emitEncoreInbox`, `emitWebhooks` (`gen/src/core/functions/`): file contracts say who writes which adapter.
- `serveGuardedCall` (`app/src/server/functions/serve-guarded-call.function.ts`) and `GuardedCallOptions`
  (`app/src/server/types/guarded-call-options.type.ts`): the option.
- Golden fixtures (`gen/__golden__/`): the new `webhook-route` fixture and the pass-through line in every `http.ts`.

## Files and folders

```text
packages/developer/gen/
├── README.md
├── package.json
├── __golden__/
└── src/
    ├── core/functions/
    │   ├── emit-encore-api.function.ts
    │   ├── emit-encore-http.function.ts
    │   ├── emit-encore-inbox.function.ts
    │   ├── emit-webhooks.function.ts
    │   └── __tests__/
    └── node/__tests__/golden.test.ts
packages/runtime/app/src/server/
├── functions/
│   ├── serve-guarded-call.function.ts
│   └── __tests__/
└── types/guarded-call-options.type.ts
.changeset/webhook-route-encore-adapters.md
```

## Data models and migrations

none

## Contracts

- `GuardedCallOptions.credentials?: "ignore" | undefined` (new, `@stackra/app/server`).
- Generated `answerCall` endpoint: `credentials?: "ignore"`, passed to `serveGuardedCall`.
- Generated routes per webhook Integration: `/webhooks/<module>/<name>` (`webhooks<Module><Name>`) and
  `/webhooks/<module>/<name>/:connectionId` (`webhooks<Module><Name>ByConnection`), `method: "*"`, `expose: true`,
  `auth: false`.

## Error handling

Unchanged: request guards and the body cap answer as before; the receiver answers a bad signature. `credentials:
"ignore"` only skips the Stackra credential check, never a guard.

## Security and tenancy

The route is public by design (a provider calls it). The provider signature, verified over the exact bytes by the
receiver, is the authentication (ADR 0308). The connection segment names a connection the receiver resolves; no
tenant is taken from a client header. No user token is forwarded from an ignored credential.

## Testing strategy

- AC-001: `emit-encore-api.function.test.ts` ("writes two raw adapters per webhook Integration, own and hosted…"), the
  `webhook-route` golden fixture.
- AC-002: `serve-guarded-call.function.test.ts` ('never verifies a raw call its adapter states credentials: "ignore"
  for, and hands the header on'), `emit-encore-http.function.test.ts`.
- AC-003: `emit-encore-api.function.test.ts` ("never writes one wildcard route per service…").
- AC-004: `emit-encore-api.function.test.ts` ("writes nothing for a service that receives no webhook").

## Rollout

Minor changesets for `@stackra/gen` and `@stackra/app`. Services run `stackra gen`; a service with webhook Integrations
exposes the new paths on its next deploy.

## Delegation and risk plan

One session, one branch (PR #1146). Change risk R3 (webhooks, the call's authentication path).

## ADRs

ADR 0308 (rules 15 and 16), ADR 0224 as amended, ADR 0294 (decision 16), ADR 0237, ADR 0457: all Accepted.

## Docs

`packages/developer/gen/README.md`, `packages/developer/gen/__golden__/README.md`,
`.changeset/webhook-route-encore-adapters.md`.

## Complexity tracking

none
