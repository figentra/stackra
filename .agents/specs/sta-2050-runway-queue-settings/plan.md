# Implementation Plan: a service runway sizes the Encore subscriptions its jobs ride

**Spec**: `.agents/specs/sta-2050-runway-queue-settings/spec.md` · **Linear**: STA-2050 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2050-runway-queue-settings/spec.md`

## Summary

Discovery reads each environment's `queues` block of a service's `runway.yaml` (`readRunwayQueues`, through gen's own
`yamlValue`) into the new optional `MemberIR.queueSettings`. `emitEncoreQueues` sets each job queue subscription's
`ackDeadline` to `queueAckDeadline(ir, queue)`: the largest `visibilityTimeoutSeconds` any environment gives the queue,
at least 1, or nothing when none is set. The full run adds `checkQueueSettings`: one `queue_dlq_unsupported` warning per
environment and job queue with `dlq: false`. `QueueSettings` is exported.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/gen` (`@stackra/gen`), `packages/developer/runway` (doc comment only)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); Encore 1.58.8 `encore debug meta` for the generated file
- **Storage**: none
- **Runtime target**: isomorphic core, node discovery

## Constitution Check

| Law                                   | Result | Note                                                               |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | gen does not take `@stackra/runway` as a dependency; it reads YAML |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                         |
| Security                              | N/A    | no request path changes                                            |
| HTTP and events                       | N/A    | no route, header or event changes                                  |
| Tenancy                               | N/A    | no tenant data                                                     |
| Delegation                            | PASS   | one session, one branch                                            |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                             |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                 |
| Versions and catalogs                 | PASS   | no dependency added                                                |
| Deploy modes (ADR 0076)               | PASS   | SaaS only; on-prem Postgres queues unchanged                       |
| Licence tier (ADR 0077)               | PASS   | free                                                               |
| Docs and ADRs                         | PASS   | README, AGENTS.md and a changeset; applies ADR 0296 to ADR 0148    |

## Deploy modes

| Mode       | Behaviour                                                               |
| ---------- | ----------------------------------------------------------------------- |
| SaaS       | each job queue's Encore subscription takes the runway's largest timeout |
| On-prem    | unchanged (Postgres queue)                                              |
| Air-gapped | unchanged (Postgres queue)                                              |

## Correctness properties

- **P-001**: for every set of queue settings, `queueAckDeadline` is the maximum of the set timeouts and 1, or undefined when none is set — Validates: FR-002, FR-003
- **P-002**: `readRunwayQueues` keeps a timeout only when it is a whole number from 0 and `dlq` only when it is a boolean — Validates: FR-001
- **P-003**: `checkQueueSettings` returns exactly one warning per environment and job queue with `dlq: false`, sorted by environment, and none otherwise — Validates: FR-004
- **P-004**: `QueueSettings` is a type export of `@stackra/gen` — Validates: FR-005

## Architecture overview

`discoverMember` → `readRunwayQueues(root)` (service layout only) → `MemberIR.queueSettings`. `emitEncoreQueues` maps
each job queue to a row with `queueAckDeadline(ir, queue)` and writes `ackDeadline: "<n>s"` into the subscription
options when defined. `generate` appends `checkQueueSettings(ir, manifest)` to the full run's warnings beside
`checkSubscriptions`.

## Components and responsibilities

- `QueueSettings` (`src/core/types/queue-settings.type.ts`): one queue of one environment.
- `MemberIR.queueSettings` (`src/core/types/member-ir.type.ts`): by environment then queue.
- `readRunwayQueues` (`src/node/functions/read-runway-queues.function.ts`): reads the blocks.
- `queueAckDeadline` (`src/core/functions/queue-ack-deadline.function.ts`): the deadline.
- `checkQueueSettings` (`src/core/functions/check-queue-settings.function.ts`): the warning.
- `emitEncoreQueues`, `discoverMember`, `generate`: wiring.

## Files and folders

```text
packages/developer/gen/
├── AGENTS.md
├── README.md
└── src/
    ├── core/
    │   ├── index.ts
    │   ├── functions/
    │   │   ├── check-queue-settings.function.ts
    │   │   ├── emit-encore-queues.function.ts
    │   │   ├── queue-ack-deadline.function.ts
    │   │   └── __tests__/ (check-queue-settings, emit-encore-queues, queue-ack-deadline)
    │   └── types/
    │       ├── member-ir.type.ts
    │       └── queue-settings.type.ts
    └── node/functions/
        ├── discover-member.function.ts
        ├── generate.function.ts
        ├── read-runway-queues.function.ts
        └── __tests__/read-runway-queues.function.test.ts
packages/developer/runway/src/core/constants/service-environment-schema.constant.ts
.changeset/sta-2050-queue-subscription-settings.md
```

- `packages/developer/gen/src/core/types/queue-settings.type.ts`
- `packages/developer/gen/src/core/types/member-ir.type.ts`
- `packages/developer/gen/src/core/index.ts`
- `packages/developer/gen/src/core/functions/queue-ack-deadline.function.ts`
- `packages/developer/gen/src/core/functions/check-queue-settings.function.ts`
- `packages/developer/gen/src/core/functions/emit-encore-queues.function.ts`
- `packages/developer/gen/src/node/functions/read-runway-queues.function.ts`
- `packages/developer/gen/src/node/functions/discover-member.function.ts`
- `packages/developer/gen/src/node/functions/generate.function.ts`
- `packages/developer/gen/src/core/functions/__tests__/queue-ack-deadline.function.test.ts`
- `packages/developer/gen/src/core/functions/__tests__/check-queue-settings.function.test.ts`
- `packages/developer/gen/src/core/functions/__tests__/emit-encore-queues.function.test.ts`
- `packages/developer/gen/src/node/functions/__tests__/read-runway-queues.function.test.ts`
- `packages/developer/runway/src/core/constants/service-environment-schema.constant.ts`
- `packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`,
  `.changeset/sta-2050-queue-subscription-settings.md`

## Data models and migrations

none

## Contracts

- `MemberIR.queueSettings?: Readonly<Record<string, Readonly<Record<string, QueueSettings>>>>` (new, optional).
- `QueueSettings { visibilityTimeoutSeconds?: number; dlq?: boolean }` (new type export of `@stackra/gen`).
- Warning `queue_dlq_unsupported` (severity `warning`, file `runway.yaml`, subject `<env>.<queue>`).
- Generated `queues.ts`: `ackDeadline: "<n>s"` on a subscription whose queue has a timeout.
- Callers: every service generated by `stackra gen`; no hand-written caller changes.

## Error handling

Warnings only: `checkQueueSettings` never refuses, so gen still writes. Malformed runway values are dropped by
discovery; runway's own schema refuses them at deploy.

## Security and tenancy

No personal data, no secret, no request input: the settings come from the committed runway file.

## Testing strategy

- AC-001: `emit-encore-queues.function.test.ts` ("sets each subscription's ack deadline ...") and
  `queue-ack-deadline.function.test.ts`; Encore `debug meta` on the generated file inside stackra-demo (300 s vs 30 s).
- AC-002: the same emit test without settings (no `ackDeadline`).
- AC-003: `check-queue-settings.function.test.ts`.
- AC-004: `read-runway-queues.function.test.ts` (reader and `discoverMember`).
- Revert check: with the source changes reverted, the emit and discovery tests fail.

## Rollout

A minor changeset for `@stackra/gen`, a patch for `@stackra/runway`. Services pick up the deadline on their next gen and
deploy.

## Delegation and risk plan

One session, one branch. Follow-up (spec R-2): infra-aws-runtime stops provisioning SQS job queues once the owner
approves gate 1.

## ADRs

ADR 0148 (decisions 1, 3 and 6), ADR 0296 (decision 1), ADR 0091, ADR 0124: all Accepted.

## Docs

`packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`, the runway schema doc comment,
`.changeset/sta-2050-queue-subscription-settings.md`.

## Complexity tracking

none
