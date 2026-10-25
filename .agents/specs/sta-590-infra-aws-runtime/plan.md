# Plan: `@stackra/infra-aws-runtime`

**Spec**: `.agents/specs/sta-590-infra-aws-runtime/spec.md`

1. **A pure plan** (`src/core/`): `runtimePlan(root, services, environment)` reads the parsed runways (types and
   enums from `@stackra/runway`) and returns plain data: queues, caches and buckets with their AWS names, sizes and
   tags. The open runway blocks (`shared.*`, `config`) are read through one field accessor. Names go through one
   internal `resourceName` (normalise, cut with an FNV-1a hash), cache sizes through `cacheNodeType` (the smallest node
   whose usable three quarters hold the size).
2. **The reader** (`src/node/`): `readRuntimePlan` reads the root and `services/*/runway.yaml` with `readRunway` and
   plans them.
3. **The program part** (`src/node/`): `awsRuntime(plan, options)` declares `@pulumi/aws` resources from the plan and
   returns their identifiers by plan key. `@pulumi/pulumi` is a peer, so the program has one runtime.
4. **Tests**: the plan against parsed template-shaped runways; the program under `pulumi.runtime.setMocks`, asserting
   each resource's inputs; the barrels' exact values and types.
5. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in the other packages.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                     |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/infrastructure/infra-aws-runtime`; workspace imports `@stackra/runway`, `@stackra/contracts` only                |
| Secrets (ADR 0173)                    | PASS   | no secret is created, read or output; caches use TLS inside the given security groups                                                    |
| Security                              | PASS   | SSE on queues and topics, at-rest and in-transit encryption on caches, public access blocked on buckets, a source-ARN-bound queue policy |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                             |
| Tenancy                               | N/A    | shared runtime infrastructure; no scope-owned data                                                                                       |
| Delegation                            | PASS   | `package-builder` writes code and tests; agents preview only, `pulumi up` stays the owner's (ADR 0171)                                   |
| Not built yet (ADR 0227)              | PASS   | engines are the ones ADR 0296 allows (`valkey`, `sns-sqs`, `s3`); nothing deferred is introduced                                         |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                |
| Versions and catalogs                 | PASS   | `catalog:`, `catalog:infra` and `workspace:*` only                                                                                       |
| Deploy modes (ADR 0076)               | PASS   | one program for every AWS environment; on-prem and air-gapped never load it                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`, private; the Pro question of ADR 0171 decision 5 is recorded for the owner                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand                                                                           |

## Deploy modes

| Mode       | Behaviour                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| SaaS       | the generated infra program declares each AWS environment's queues, topics, caches and buckets            |
| On-prem    | not used: compose and Helm bring their own Valkey and object storage containers                           |
| Air-gapped | not used: the same as on-prem; the package makes no network call itself, Pulumi does at the owner's apply |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./node`, and no file under `src/core/` imports `@pulumi/*` or `node:*` — Validates: FR-001
- **P-002**: `.` exports exactly `runtimePlan`, and the plan types resolve — Validates: FR-002
- **P-003**: `./node` exports exactly `awsRuntime` and `readRuntimePlan`, none shared with `.`, and the option and result types resolve — Validates: FR-003
- **P-004**: a sized queue gets a dead-letter queue from its own `dlq` or the shared default, and a topic exactly when the provider is `sns-sqs` — Validates: FR-004
- **P-005**: the shared cache follows `shared.cache`, a dedicated cache appears only for a dedicated `valkey` requirement under the `valkey` driver, and an unsizable or unknown setting fails naming its path — Validates: FR-005
- **P-006**: a sized bucket is versioned unless the root says `false`, with the noncurrent expiry only when versioned — Validates: FR-006
- **P-007**: every planned resource carries `env` and `service`, and `group` exactly when the topology places the member — Validates: FR-007
- **P-008**: every name is lower-case with single hyphens and at most its kind's limit, and a cut name is stable and distinct — Validates: FR-008
- **P-009**: under Pulumi's mocks, queues and topics are encrypted, caches use TLS and at-rest encryption, buckets block public access, and the queue policy names its topic only — Validates: FR-009
