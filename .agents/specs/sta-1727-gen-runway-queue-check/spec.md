# Specification: gen checks that every derived queue has a runway entry

**Feature Branch**: `figentra/sta-1727-gen-runway-queue-check`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1727

**Clarifications status**: complete

**Input**: Follow-up to STA-1723 (leader decision 2026-10-31: `#stackra/queues` lists job queues plus `default`). A job
must never run on a queue the infrastructure does not provision (visibility timeout, DLQ), so gen checks each derived
job queue against the member's `runway.yaml`.

## Impact

- **Apps touched**: none
- **Services touched**: none in core; a product service whose runway environment leaves out a job queue is refused
  until it lists it (the OS services checked already list theirs: billing, notifications, access, audit)
- **Packages touched**: `packages/developer/gen` (`runwayQueues`, `yamlKeyTree`, `generate`, tests, README, AGENTS)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0296: a member's runway sizes its own queues; this only checks it)
- **New dependencies**: none (a block-YAML key reader, as `encoreApp` reads the root runway)
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: gen README and AGENTS
- **Lane**: lite
- **Change risk**: R1 (a new refusal on a service's full run)

## Requirements

- **FR-001** A service's full run refuses `queue_unprovisioned` for each job queue (`default` aside) and each
  environment under `environments` of its `runway.yaml` that has no `queues.<queue>` entry.
- **FR-002** No refusal when the member has no job queue other than `default`, no `runway.yaml`, or no environment.
- **FR-003** Tests: the refusal per environment and queue, a provisioned member, a missing runway, `default` only; the
  key reader skips list items, flow maps and block scalars.

## Status history

- 2026-11-01 → Clarified (leader decision through STA-1723)
