# Implementation Plan: gen's Encore topic files pass Encore's parser

**Spec**: `.agents/specs/sta-2666-encore-topic-files/spec.md` · **Linear**: STA-2666 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2666-encore-topic-files/spec.md`

## Summary

`emitEncoreEvents` and `emitEncoreQueues` register `topic.ref<Publisher<BrokerMessage>>()`. A new
`emitEncoreBrokerMessage` writes `broker-message.ts` beside the topic files whenever one of them imports it, and every
generated file that named `BrokerMessage` from `@stackra/queue/contracts` imports it from `./broker-message`. A test
parses both declarations and compares their members.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/` and the gen golden files, on CI
- **Storage**: none
- **Runtime target**: the generated Encore app

## Constitution Check

| Law                                   | Result | Note                                           |
| ------------------------------------- | ------ | ---------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                  |
| Secrets (ADR 0009)                    | N/A    | none                                           |
| Security                              | PASS   | the ref grants only the publish already used   |
| HTTP and events                       | PASS   | topic names, subscriptions and bodies the same |
| Tenancy                               | N/A    | none                                           |
| Delegation                            | PASS   | Claude only                                    |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated (ADR 0091, 0124)        |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                     |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen               |
| Deploy modes (ADR 0076)               | PASS   | same in all three                              |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                      |
| Docs and ADRs                         | N/A    | no rule changes                                |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | the generated Encore app builds; topics unchanged |
| On-prem    | the generated Encore app builds; topics unchanged |
| Air-gapped | the generated Encore app builds; no call added    |

## Correctness properties

- **P-001**: no generated topic file holds `topic: <name> }`; each registration is a `Publisher` ref — Validates:
  AC-001
- **P-002**: a service with events or queues gets `broker-message.ts`, and no generated Encore file imports
  `BrokerMessage` from a package — Validates: AC-002
- **P-003**: the emitted interface and queue's interface have the same member names, readonly flags and type text —
  Validates: AC-003

## Architecture overview

gen's member pass collects the Encore files as before. After them, `emitEncoreBrokerMessage` adds
`.stackra/encore/<member>/broker-message.ts` when any of those files imports `./broker-message`. Encore resolves the
type from that local file; the runtime passes the same `{ id, body }` objects.

## Components and responsibilities

- `emitEncoreEvents` (events, relay, subscriptions): publisher refs; `BrokerMessage` from `./broker-message`.
- `emitEncoreQueues`: publisher refs; `BrokerMessage` from `./broker-message`; `QueuedJob` stays a package type (it is
  named by no topic or subscription).
- `emitEncoreBrokerMessage`: the local declaration, written only when imported.
- `generateMember`: adds it after the Encore files.

## Files and folders

```text
packages/developer/gen/
  src/core/functions/emit-encore-events.function.ts
  src/core/functions/emit-encore-queues.function.ts
  src/core/functions/emit-encore-broker-message.function.ts
  src/core/functions/generate-member.function.ts
  src/core/functions/__tests__/emit-encore-events.function.test.ts
  src/core/functions/__tests__/emit-encore-queues.function.test.ts
  src/core/functions/__tests__/emit-encore-broker-message.function.test.ts
  __golden__/*/expected/services/*/.stackra/encore/*/{events,relay,subscriptions,broker-message}.ts.golden
.changeset/gen-encore-topic-files.md
```

## Data models and migrations

none

## Contracts

none changed: the generated files register the same topic names and carry the same message shape.

## Error handling

none changed: `registerBrokerTopics` still refuses a nameless, publish-less or duplicate topic.

## Security and tenancy

none

## Testing strategy

- AC-001: the events and queues emitter tests assert the ref form and no bare topic.
- AC-002: the broker-message emitter test (written only when imported) and the golden files.
- AC-003: the drift test parses both interfaces with the TypeScript API and compares their members.

## Rollout

A patch changeset for `@stackra/gen`, in 0.33.1. RUNWAY re-runs the Encore build spike against it.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
