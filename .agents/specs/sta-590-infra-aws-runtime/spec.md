# Feature Specification: `@stackra/infra-aws-runtime`, the AWS runtime resources members declare in runway

**Feature Branch**: `figentra/sta-348-complete`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-590

**Linear project**: Figentra OS build

**Clarifications status**: complete

**Input**: Create `@stackra/infra-aws-runtime` (infrastructure, Track R, STA-72): Pulumi programs for the runtime
resources that service members declare in their `runway.yaml` (ADR 0296), per environment: queues, topics, caches and
buckets, derived from the root and member runways through `@stackra/runway`, with unit tests under Pulumi's mocks.

## Impact

- **Apps touched**: none
- **Services touched**: none (their `runway.yaml` files are the input; nothing in a service changes)
- **Packages touched**: `packages/infrastructure/infra-aws-runtime` (new member, first of its category folder with the other `infra-*` builders)
- **Cross-service events**: none
- **Tenancy and data**: none; the resources are shared runtime infrastructure and hold no scope-owned record of their own
- **Secrets**: none. No secret is created, read or output; caches are reached over TLS inside the given security groups (ADR 0173)
- **ADR needed**: no (ADR 0171, 0296, 0169, 0186, 0172). ADR 0171 decision 5 and ADR 0202 decision 2 place the own-cloud runtime stack in `@stackra-pro`; the distribution is an owner item, see Clarifications
- **New dependencies**: `@pulumi/aws` and `@pulumi/pulumi` (peer), referenced as `catalog:infra`, which the integrator adds
- **Deploy modes**: SaaS and own-cloud AWS environments; on-prem and air-gapped installs use compose or Helm and never load this program
- **Licence tier**: MIT in the repository and `"private": true`; npmjs or the Pro channel is the owner's call before the first publish
- **Docs to update**: `packages/infrastructure/infra-aws-runtime/README.md`, `packages/infrastructure/infra-aws-runtime/AGENTS.md`; ADR 0171, 0296 cited, none amended
- **Lane**: full (a new package)
- **Change risk**: R2 (new infrastructure contract; previews only, no apply by agents, no secret, no HTTP)

## Clarifications

### Session 2026-10-25

- The plan reads only runway files (the work item): names come from the keys a member sizes under
  `environments.<env>.queues` and `.buckets`; a manifest queue or bucket without a size is gen's to add later.
- `requires` matters here for `valkey` only: a member's queues and buckets are its own already, and a dedicated
  `postgres` server belongs to the database stack.
- A dedicated cache exists only where the member's effective cache driver is `valkey` (the template's commerce runway
  says so); the shared cache exists where the root's `shared.cache.engine` is `valkey`.
- The `sns-sqs` queue provider puts an SNS topic of the same name in front of each queue, which is what an Encore
  Pub/Sub topic with one subscription needs on AWS.
- Open for the owner: ADR 0171 decision 5 (and the programming-model notes) make the own-cloud runtime stack
  `@stackra-pro/infra-aws-runtime`, while the registry and this work item name `@stackra/infra-aws-runtime`. The
  package is built here, MIT and private; where it ships is decided before its first publish.

## User Scenarios & Testing

### User Story 1 - One environment's runtime resources come from runway (Priority: P1)

`stackra infra gen` writes a program that calls `readRuntimePlan(repositoryRoot, env)` and `awsRuntime(plan, { network })`.
Every queue, topic, cache and bucket of that environment, with its size, is what the root and service runways say.

**Independent Test**: `src/core/functions/__tests__/{runtime-plan,resource-name,cache-node-type}.function.test.ts`,
`src/node/functions/__tests__/read-runtime-plan.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template-shaped staging runways, **When** `runtimePlan` runs, **Then** each sized queue has its
   dead-letter queue and topic, the shared cache and commerce's dedicated cache (`volatile-ttl`, smallest fitting node)
   are planned, and the bucket is versioned with a 30-day noncurrent expiry, all tagged with `env`, `service` and `group`.
2. **Given** dev (memory drivers, no shared pools), **Then** no cache and no topic is planned.
3. **Given** a dedicated cache too big for any node, or an unknown eviction policy, **Then** `RunwayInvalidError` names
   the runway path.
4. **Given** a repository directory, **When** `readRuntimePlan` runs, **Then** it reads the root and each
   `services/<folder>/runway.yaml`, keying `loyalty-kit` as `loyalty_kit`.

### User Story 2 - The program declares safe resources (Priority: P1)

**Independent Test**: `src/node/functions/__tests__/aws-runtime.function.test.ts` (Pulumi mocks).

**Acceptance Scenarios**:

1. **Given** a plan, **When** `awsRuntime` runs under mocks, **Then** queues use SSE-SQS with a redrive to a 14-day
   dead-letter queue, topics use SSE, the subscription is raw and the queue policy admits only its topic.
2. **Then** caches run Valkey with TLS and at-rest encryption in one subnet group, and buckets block public access.
3. **Then** the returned outputs give each queue's URL and ARN, each topic's ARN, each cache's endpoint and each
   bucket's name by plan key.

## Requirements

- **FR-001**: Entries `.` and `./node` only (ADR 0127 2026-10-24 note); `.` imports neither `@pulumi/*` nor `node:*`.
- **FR-002**: `.` exports `runtimePlan` and the types `RuntimePlan`, `QueuePlan`, `CachePlan`, `BucketPlan`.
- **FR-003**: `./node` exports `readRuntimePlan`, `awsRuntime` and the types `AwsRuntimeOptions`, `AwsRuntime`.
- **FR-004**: Queues come from member `environments.<env>.queues`, with a dead-letter queue from the member's `dlq` or
  the root's `shared.queues.dlq`, and an SNS topic in front when `shared.queues.provider` is `sns-sqs`.
- **FR-005**: The shared cache comes from `shared.cache` (`engine: valkey`, `node`, `replicas`); a dedicated cache from
  a `requires` entry with `engine: valkey` and `dedicated: true`, only where the member's cache driver is `valkey`,
  sized from `cache.memoryMb`, `replicas` and `eviction`.
- **FR-006**: Buckets come from member `environments.<env>.buckets`; versioning is on unless `shared.buckets.versioning`
  is `false` (ADR 0186), with `shared.buckets.lifecycle.expireNoncurrentDays`.
- **FR-007**: Every resource is tagged `env`, `service` and, where the topology places the member, `group` (ADR 0172).
- **FR-008**: Names are `<project>-<env>-<member>-<key>`, lower-case with single hyphens, cut to the AWS limit with a
  stable hash.
- **FR-009**: Encryption at rest and in transit on every resource; public access blocked on every bucket; no secret
  created or read.

## Success Criteria

- **SC-001**: Every public symbol has a test in a `__tests__/` folder beside it; the Pulumi code runs under mocks only.
- **SC-002**: `pnpm verify` green for the member (run in the separate testing workflow).

## Out of scope

- The database server, the VPC, the load balancer, the compute and the image registry (database, network and
  foundation stacks; the own-cloud compute is `@stackra-pro`, ADR 0171 decision 5).
- Choosing which environments compose this program from `destinations.services`: `stackra infra gen`.
- Cross-member subscriptions from manifest `consumes`, and Encore's `infra.config.json`: gen.
- Bucket replication to the backup account (ADR 0186 decision 3): needs `@stackra/infra-aws`'s backup bucket and role.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · package created with its spec (owner mode 2026-10-24: develop now, test later)
