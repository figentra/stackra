# Implementation Plan: gen hands Encore topics to the broker as publisher refs

**Spec**: `.agents/specs/sta-2663-gen-encore-topic-ref/spec.md` · **Linear**: STA-2663 · **Date**: 2026-11-09

**Input**: Feature specification from `.agents/specs/sta-2663-gen-encore-topic-ref/spec.md`

## Summary

`emitEncoreEvents` and `emitEncoreQueues` write `topic: <topic>` into `registerBrokerTopics`, which Encore's parser
refuses. Both write `topic: <topic>.ref<Publisher<BrokerMessage>>()` and import `Publisher` with `Topic`. The ref has
`publish`, all `registerBrokerTopics` and the topic broker publisher need.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022) and the gen golden files, on CI
- **Storage**: none
- **Runtime target**: the generated Encore app

## Constitution Check

| Law                                   | Result | Note                                         |
| ------------------------------------- | ------ | -------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                |
| Secrets (ADR 0009)                    | N/A    | no secret is read or added                   |
| Security                              | PASS   | the ref grants only the publish already used |
| HTTP and events                       | PASS   | topic names and subscriptions unchanged      |
| Tenancy                               | N/A    | no data                                      |
| Delegation                            | PASS   | Claude only                                  |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated (ADR 0091, 0124)      |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                   |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen             |
| Deploy modes (ADR 0076)               | PASS   | same in all three                            |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                    |
| Docs and ADRs                         | N/A    | no rule changes                              |

## Steps

1. Both emitters import `Publisher` from `encore.dev/pubsub` and register `<topic>.ref<Publisher<BrokerMessage>>()`.
2. The emitter tests assert the ref form and that no bare `topic: <name>` remains.
3. The golden `events.ts` and `queues.ts` files follow.
4. A patch changeset for @stackra/gen.
